import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Router, Waypoints, Lock, Server, Save, Cloud } from "lucide-react";
import { api } from "@/lib/api";
import { pickPin } from "@/assets/atlas/pins";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { cn, formatBytes } from "@/lib/utils";
import type { Inbound } from "@/lib/types";

const protocolAccent: Record<string, string> = {
  vless: "#a3e635",
  vmess: "#7dd3fc",
  trojan: "#fbbf24",
};

// Random address pool: 69.46.46.1 … 69.46.46.244
const ADDRESS_BASE = "69.46.46";
const ADDRESS_MIN = 1;
const ADDRESS_MAX = 244;

function randomAddress(): string {
  const n = ADDRESS_MIN + Math.floor(Math.random() * (ADDRESS_MAX - ADDRESS_MIN + 1));
  return `${ADDRESS_BASE}.${n}`;
}

// Official Railway brand mark (simple-icons)
function RailwayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M.113 10.27A13.026 13.026 0 000 11.48h18.23c-.064-.125-.15-.237-.235-.347-3.117-4.027-4.793-3.677-7.19-3.78-.8-.034-1.34-.048-4.524-.048-1.704 0-3.555.005-5.358.01-.234.63-.459 1.24-.567 1.737h9.342v1.216H.113v.002zm18.26 2.426H.009c.02.326.05.645.094.961h16.955c.754 0 1.179-.429 1.315-.96zm-17.318 4.28s2.81 6.902 10.93 7.024c4.855 0 9.027-2.883 10.92-7.024H1.056zM11.988 0C7.5 0 3.593 2.466 1.531 6.108l4.75-.005v-.002c3.71 0 3.849.016 4.573.047l.448.016c1.563.052 3.485.22 4.996 1.364.82.621 2.007 1.99 2.712 2.965.654.902.842 1.94.396 2.934-.408.914-1.289 1.458-2.353 1.458H.391s.099.42.249.886h22.748A12.026 12.026 0 0024 12.005C24 5.377 18.621 0 11.988 0z" />
    </svg>
  );
}

function InboundAddressEditor({
  inbound,
  onSave,
}: {
  inbound: Inbound;
  onSave: (address: string) => void;
}) {
  const [draft, setDraft] = React.useState(inbound.address || "");
  React.useEffect(() => setDraft(inbound.address || ""), [inbound.address]);
  const { t } = useI18n();

  const dirty = draft.trim() !== (inbound.address || "").trim();

  const save = () => {
    const v = draft.trim();
    onSave(v);
    setDraft(v);
  };

  return (
    <div className="mt-2.5 space-y-1.5">
      <div className="flex items-center gap-2 rounded-base border-2 border-border bg-bg/40 px-2.5 py-2 text-[11px]">
        <Server className="h-3.5 w-3.5 shrink-0 text-text/50" />
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
          placeholder={t("address")}
          spellCheck={false}
          className="min-w-0 flex-1 bg-transparent font-mono text-text/80 outline-none placeholder:text-text/30"
        />
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={() => setDraft(randomAddress())}
          title={t("randomAddressHint")}
          className="h-8 w-full justify-center gap-1.5 border-border bg-violet-300 px-2 text-xs text-black hover:bg-violet-200 hover:text-black [&_svg]:size-3.5"
        >
          <RailwayIcon />
          Railway
        </Button>
        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={() => void pickPin().then((v) => v && setDraft(v))}
          title={t("cleanHint")}
          className="h-8 w-full justify-center gap-1.5 border-border bg-yellow-300 px-2 text-xs text-black hover:bg-yellow-200 hover:text-black [&_svg]:size-3.5"
        >
          <Cloud />
          Cloudflare
        </Button>
        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={save}
          disabled={!dirty}
          className={cn(
            "h-8 w-full justify-center gap-1.5 px-2 text-xs [&_svg]:size-3.5",
            dirty
              ? "animate-pop-in border-border bg-emerald-300 text-black hover:bg-emerald-200 hover:text-black"
              : "bg-bw text-text/40",
          )}
        >
          <Save />
          {t("save")}
        </Button>
      </div>
    </div>
  );
}

export default function InboundsPage() {
  const toast = useToast();
  const { t } = useI18n();
  const qc = useQueryClient();

  const { data: inbounds = [] } = useQuery<Inbound[]>({
    queryKey: ["inbounds"],
    queryFn: api.inbounds,
    refetchInterval: 10000,
  });

  const { data: traffic } = useQuery({
    queryKey: ["traffic"],
    queryFn: api.trafficStats,
    refetchInterval: 10000,
  });

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: { enabled?: boolean; address?: string } }) =>
      api.updateInbound(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inbounds"] });
      toast.push("success", t("inboundUpdated"));
    },
    onError: (e: Error) => toast.push("error", e.message),
  });

  const enabledCount = inbounds.filter((i) => i.enabled).length;
  const trafficByTag = new Map(
    (traffic?.inbounds ?? []).map((r) => [r.inbound_tag, r.up + r.down] as const),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Waypoints}
        accent="#fbbf24"
        title={t("inbounds")}
        description={t("inboundsDesc")}
        actions={
          <Badge variant="info" className="h-9 gap-1.5 px-3">
            <Waypoints className="h-4 w-4 shrink-0" />
            {enabledCount} / {inbounds.length} {t("enabledCount")}
          </Badge>
        }
      />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-6">
        {inbounds.map((ib, i) => {
          const used = trafficByTag.get(ib.tag) ?? 0;
          const accent = protocolAccent[ib.protocol] || "#a3e635";
          const n = inbounds.length;
          const remLg = n % 3;
          const isLast = i === n - 1;
          const isLastTwo = i >= n - 2;
          const span = cn(
            "lg:col-span-2",
            remLg === 1 && isLast && "lg:col-span-6",
            remLg === 2 && isLastTwo && "lg:col-span-3",
          );
          return (
            <Card
              key={ib.id}
              className={cn(
                "card-lift animate-rise flex flex-col overflow-hidden",
                span,
                !ib.enabled && "opacity-60 saturate-[0.4]",
              )}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="h-1.5 w-full shrink-0" style={{ background: accent }} />
              <CardContent className="flex flex-1 flex-col p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <div
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-base border-2 border-border font-heading text-sm uppercase text-black"
                      style={{ background: accent }}
                    >
                      {ib.protocol.slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-heading text-base">{ib.tag}</div>
                      <div className="text-[10px] uppercase tracking-widest text-text/50">
                        {ib.protocol} · {ib.transport}
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={!!ib.enabled}
                    onCheckedChange={(v) => update.mutate({ id: ib.id, patch: { enabled: v } })}
                  />
                </div>

                <div className="mt-3 grid grid-cols-3 gap-1.5">
                  <div className="rounded-base border-2 border-border bg-bg/40 px-1 py-2 text-center">
                    <div className="truncate font-heading text-sm">{ib.port}</div>
                    <div className="text-[9px] uppercase tracking-widest text-text/50">
                      {t("port")}
                    </div>
                  </div>
                  <div className="rounded-base border-2 border-border bg-sky-300/15 px-1 py-2 text-center">
                    <div className="truncate font-heading text-sm">{formatBytes(used)}</div>
                    <div className="text-[9px] uppercase tracking-widest text-text/50">
                      {t("used")}
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-base border-2 border-border bg-lime-300/15 px-1 py-2 text-center">
                    <Lock className="h-3.5 w-3.5 text-lime-500" />
                    <div className="text-[9px] uppercase tracking-widest text-lime-600 dark:text-lime-400">
                      TLS 443
                    </div>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center gap-2 rounded-base border-2 border-border bg-bg/40 px-2.5 py-2 text-[11px]">
                  <Router className="h-3.5 w-3.5 shrink-0 text-text/50" />
                  <span className="min-w-0 flex-1 truncate font-mono text-text/80">{ib.path}</span>
                </div>

                <InboundAddressEditor
                  inbound={ib}
                  onSave={(address) => update.mutate({ id: ib.id, patch: { address } })}
                />

                {!ib.enabled && (
                  <div className="mt-auto flex justify-center pt-3">
                    <Badge variant="danger" className="text-[10px] uppercase">
                      {t("disabled")}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
