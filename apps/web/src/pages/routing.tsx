import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban, Plus, Trash2, Globe, Route, Check, Server } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MultiCombobox, type ComboItem } from "@/components/ui/combobox";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import type { Inbound, RoutingRule, RoutingPreset } from "@/lib/types";

export default function RoutingPage() {
  const toast = useToast();
  const { t } = useI18n();
  const qc = useQueryClient();
  const [values, setValues] = React.useState<string[]>([]);
  const [selected, setSelected] = React.useState<number[]>([]);
  const labelsRef = React.useRef<Record<string, string>>({});

  const { data: rules = [] } = useQuery<RoutingRule[]>({
    queryKey: ["routing"],
    queryFn: api.routing,
  });
  const { data: inbounds = [] } = useQuery<Inbound[]>({
    queryKey: ["inbounds"],
    queryFn: api.inbounds,
  });
  const { data: presets } = useQuery<{ domains: RoutingPreset[]; ips: RoutingPreset[] }>({
    queryKey: ["routing-presets"],
    queryFn: api.routingPresets,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["routing"] });

  const addMut = useMutation({
    mutationFn: async () => {
      for (const v of values) {
        await api.addRouting(v, selected, "domain", labelsRef.current[v] || v);
      }
    },
    onSuccess: () => {
      toast.push("success", t("blockRulesAdded"));
      setValues([]);
      setSelected([]);
      invalidate();
    },
    onError: (e: Error) => toast.push("error", e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.deleteRouting(id),
    onSuccess: () => {
      toast.push("success", t("ruleRemoved"));
      invalidate();
    },
    onError: (e: Error) => toast.push("error", e.message),
  });

  const domainItems: ComboItem[] = React.useMemo(
    () =>
      (presets?.domains ?? []).map((p) => ({
        value: p.values[0],
        label: p.label,
        group: "Presets",
      })),
    [presets],
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (values.length === 0) {
      toast.push("error", t("chooseDomain"));
      return;
    }
    if (selected.length === 0) {
      toast.push("error", t("chooseInbound"));
      return;
    }
    addMut.mutate();
  };

  const toggle = (id: number) =>
    setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const selectAll = () =>
    setSelected(selected.length === inbounds.length ? [] : inbounds.map((i) => i.id));

  const inboundName = (id: number) => inbounds.find((i) => i.id === id)?.tag || `#${id}`;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Route}
        accent="#fbbf24"
        title={t("routing")}
        description={t("routingDesc")}
        actions={
          <Badge variant="danger" className="h-9 gap-1.5 px-3">
            <Ban className="h-4 w-4 shrink-0" />
            {rules.length} {t("activeRules")}
          </Badge>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-stretch">
        <Card className="card-lift flex flex-col overflow-hidden">
          <div className="h-1.5 w-full shrink-0 bg-[#7dd3fc]" />
          <CardHeader>
            <div className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-main" />
              <CardTitle>{t("blockDomains")}</CardTitle>
            </div>
            <CardDescription>{t("blockDomainsHint")}</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <form onSubmit={submit} className="space-y-4" noValidate>
              <MultiCombobox
                items={domainItems}
                selected={values}
                onChange={setValues}
                labels={labelsRef.current}
                placeholder={t("domainPlaceholder")}
              />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-heading text-text/70">{t("applyToInbounds")}</div>
                  <button
                    type="button"
                    onClick={selectAll}
                    className="text-xs font-heading text-text/60 underline-offset-2 hover:underline"
                  >
                    {selected.length === inbounds.length ? t("clearAll") : t("selectAll")}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {inbounds.map((ib, idx) => {
                    const active = selected.includes(ib.id);
                    const odd = inbounds.length % 2 === 1;
                    return (
                      <button
                        key={ib.id}
                        type="button"
                        onClick={() => toggle(ib.id)}
                        className={cn(
                          "item-lift flex min-w-0 items-center justify-center gap-1.5 rounded-base border-2 border-border px-2 py-2.5 text-center text-xs font-heading",
                          active ? "bg-main text-mtext neo-shadow" : "bg-bw hover:bg-main/10",
                          odd && idx === inbounds.length - 1 && "col-span-2",
                        )}
                      >
                        {active && <Check className="h-3.5 w-3.5 shrink-0" />}
                        <span className="truncate">{ib.tag}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={addMut.isPending}>
                <Plus className="h-4 w-4" />{t("addBlockRule")}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="card-lift flex flex-col overflow-hidden">
          <div className="h-1.5 w-full shrink-0 bg-[#fbbf24]" />
          <CardHeader>
            <div className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-main" />
              <CardTitle>{t("blockedDomains")}</CardTitle>
            </div>
            <CardDescription>{rules.length} {t("activeRules")}</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-2 lg:max-h-[520px] lg:overflow-y-auto">
            {rules.length === 0 && (
              <div className="flex flex-col items-center gap-2 rounded-base border-2 border-dashed border-border/40 py-10 text-center text-sm text-text/50">
                <Ban className="h-8 w-8" />
                <p>{t("noBlockRules")}</p>
              </div>
            )}
            {rules.map((r, i) => (
              <div
                key={r.id}
                className="item-lift animate-rise overflow-hidden rounded-base border-2 border-border bg-bw"
                style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
              >
                <div className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-base border-2 border-border bg-[#fbbf24]">
                      <Globe className="h-4 w-4 text-black" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-heading text-sm">{r.label || r.domain}</div>
                      {r.label && r.domain && r.label !== r.domain && (
                        <div className="truncate font-mono text-[11px] text-text/50">{r.domain}</div>
                      )}
                    </div>
                    <Button
                      variant="danger"
                      size="icon"
                      className="h-9 w-9 shrink-0"
                      onClick={() => deleteMut.mutate(r.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-1.5">
                    {(() => {
                      const list = r.inbound_ids.length === 0 ? inbounds.map((i) => i.id) : r.inbound_ids;
                      const odd = list.length % 2 === 1;
                      return list.map((id, idx) => (
                        <span
                          key={id}
                          className={cn(
                            "flex min-w-0 items-center justify-center gap-1.5 rounded-base border-2 border-border bg-bg/40 px-2 py-1.5",
                            odd && idx === list.length - 1 && "col-span-2 bg-sky-300/15",
                          )}
                        >
                          <Server className="h-3 w-3 shrink-0 text-sky-400" />
                          <span className="truncate font-heading text-[11px]">{inboundName(id)}</span>
                        </span>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
