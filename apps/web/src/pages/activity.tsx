import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ScrollText,
  Trash2,
  LogIn,
  UserPlus,
  UserCog,
  UserX,
  Power,
  Settings2,
  KeyRound,
  Download,
  Upload,
  Router,
  ShieldAlert,
  List,
  Users2,
  Server,
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { cn, formatDate, relativeTime } from "@/lib/utils";
import type { ActivityEntry } from "@/lib/types";

const actionMeta: Record<
  string,
  { icon: React.ElementType; labelKey: string; color: string }
> = {
  login: { icon: LogIn, labelKey: "actSignedIn", color: "info" },
  login_failed: { icon: ShieldAlert, labelKey: "actFailedLogin", color: "danger" },
  setup: { icon: Power, labelKey: "actSetup", color: "success" },
  user_create: { icon: UserPlus, labelKey: "actCreatedUser", color: "success" },
  user_update: { icon: UserCog, labelKey: "actUpdatedUser", color: "info" },
  user_delete: { icon: UserX, labelKey: "actDeletedUser", color: "danger" },
  user_toggle: { icon: Power, labelKey: "actToggledUser", color: "warning" },
  user_reset_traffic: { icon: Router, labelKey: "actResetTraffic", color: "warning" },
  user_rotate_token: { icon: KeyRound, labelKey: "actRotatedToken", color: "warning" },
  inbound_toggle: { icon: Router, labelKey: "actToggledInbound", color: "warning" },
  settings_update: { icon: Settings2, labelKey: "actUpdatedSettings", color: "info" },
  credentials_change: { icon: KeyRound, labelKey: "actChangedCredentials", color: "warning" },
  backup_export: { icon: Download, labelKey: "actExportedBackup", color: "info" },
  backup_import: { icon: Upload, labelKey: "actImportedBackup", color: "warning" },
  activity_clear: { icon: Trash2, labelKey: "actClearedLog", color: "danger" },
  admin_create: { icon: UserPlus, labelKey: "actAdminCreate", color: "success" },
  admin_update: { icon: UserCog, labelKey: "actAdminUpdate", color: "info" },
  admin_delete: { icon: UserX, labelKey: "actAdminDelete", color: "danger" },
  routing_add: { icon: Router, labelKey: "actRoutingAdd", color: "warning" },
  routing_update: { icon: Router, labelKey: "actRoutingUpdate", color: "info" },
  routing_delete: { icon: Router, labelKey: "actRoutingDelete", color: "danger" },
  bot_update: { icon: Settings2, labelKey: "actBotUpdate", color: "info" },
  bot_test: { icon: Settings2, labelKey: "actBotTest", color: "info" },
};

type Category = "all" | "auth" | "clients" | "system";

const AUTH_ACTIONS = new Set(["login", "login_failed", "setup"]);
const CLIENT_ACTIONS = new Set([
  "user_create",
  "user_update",
  "user_delete",
  "user_toggle",
  "user_reset_traffic",
  "user_rotate_token",
]);

function categoryOf(action: string): Exclude<Category, "all"> {
  if (AUTH_ACTIONS.has(action)) return "auth";
  if (CLIENT_ACTIONS.has(action)) return "clients";
  return "system";
}

export default function ActivityPage() {
  const toast = useToast();
  const { t } = useI18n();
  const qc = useQueryClient();
  const { data: entries = [] } = useQuery<ActivityEntry[]>({
    queryKey: ["activity"],
    queryFn: api.activity,
    refetchInterval: 8000,
  });

  const clearMut = useMutation({
    mutationFn: () => api.clearActivity(),
    onSuccess: () => {
      toast.push("success", t("logCleared"));
      qc.invalidateQueries({ queryKey: ["activity"] });
    },
  });

  const [filter, setFilter] = React.useState<Category>("all");
  const counts = React.useMemo(() => {
    const c: Record<Category, number> = { all: entries.length, auth: 0, clients: 0, system: 0 };
    for (const e of entries) c[categoryOf(e.action)] += 1;
    return c;
  }, [entries]);
  const visible =
    filter === "all" ? entries : entries.filter((e) => categoryOf(e.action) === filter);

  const chips: { key: Category; label: string; icon: React.ElementType; color: string }[] = [
    { key: "all", label: t("filterAll"), icon: List, color: "#64748b" },
    { key: "auth", label: t("filterAuth"), icon: LogIn, color: "#38bdf8" },
    { key: "clients", label: t("filterClients"), icon: Users2, color: "#a3e635" },
    { key: "system", label: t("filterSystem"), icon: Server, color: "#fbbf24" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={ScrollText}
        accent="#fde047"
        title={t("activityLog")}
        description={t("recentEvents")}
        actions={
          <Button
            variant="danger"
            className="w-full sm:w-auto"
            onClick={() => clearMut.mutate()}
            disabled={entries.length === 0}
          >
            <Trash2 className="h-4 w-4" />
            {t("clearLog")}
          </Button>
        }
      />

      {entries.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          {chips.map((c) => {
            const active = filter === c.key;
            const Icon = c.icon;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => setFilter(c.key)}
                title={c.label}
                className={cn(
                  "card-lift group relative flex min-w-0 items-center gap-2.5 overflow-hidden rounded-base border-2 border-border px-3 py-2.5 transition-all",
                  active ? "neo-shadow bg-main/10" : "bg-bw hover:bg-main/5",
                )}
              >
                <span
                  className="absolute inset-y-0 left-0 w-1.5"
                  style={{ background: c.color, opacity: active ? 1 : 0.55 }}
                />
                <span
                  className="ml-1 grid h-9 w-9 shrink-0 place-items-center rounded-[6px] border-2 border-border"
                  style={{ background: c.color }}
                >
                  <Icon className="h-4 w-4 text-black" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col items-start leading-tight">
                  <span className="w-full truncate text-left font-heading text-sm uppercase tracking-wide">
                    {c.label}
                  </span>
                  <span className="text-xs font-base text-text/60">{counts[c.key]}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      <Card className="card-lift overflow-hidden">
        <div className="h-1.5 w-full bg-[#fbbf24]" />
        <CardContent className="p-0">
          {visible.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-text/50">
              <ScrollText className="h-10 w-10" />
              <p className="font-heading">{t("noActivity")}</p>
            </div>
          ) : (
            <ul className="relative divide-y-2 divide-border/30 before:absolute before:bottom-4 before:left-[18px] before:top-4 before:w-0.5 before:bg-border/25 sm:before:left-[22px]">
              {visible.map((e, i) => {
                const meta = actionMeta[e.action] || {
                  icon: ScrollText,
                  labelKey: "",
                  color: "neutral",
                };
                const Icon = meta.icon;
                const label = meta.labelKey ? t(meta.labelKey as never) : e.action;
                const detail =
                  e.detail === "panel initialized" ? t("detailPanelInit" as never) : e.detail;
                return (
                  <li
                    key={e.id}
                    className="animate-rise flex items-start gap-3 px-4 py-3 transition-colors hover:bg-main/5 sm:items-center sm:gap-4 sm:px-5 sm:py-3.5"
                    style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                  >
                    <div className="relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-base border-2 border-border bg-bg sm:h-10 sm:w-10">
                      <Icon className="h-4 w-4 text-text/80 sm:h-5 sm:w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-heading text-sm sm:text-base">{label}</span>
                        {detail && (
                          <Badge variant={meta.color as never} className="max-w-full truncate text-[10px]">
                            {detail}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs font-base text-text/50">
                        <span>{t("by")} {e.actor}</span>
                        <span className="hidden sm:inline">·</span>
                        <span className="sm:hidden">{formatDate(e.ts)}</span>
                      </div>
                    </div>
                    <div
                      className="hidden whitespace-nowrap text-xs font-base text-text/50 sm:block"
                      title={formatDate(e.ts)}
                    >
                      {relativeTime(e.ts)}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
