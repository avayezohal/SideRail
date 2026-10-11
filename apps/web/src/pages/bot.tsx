import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, Send, Save, Plus, Trash2, ShieldCheck, Eye, EyeOff, CircleCheck, Archive } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { BotConfig } from "@/lib/types";

export default function BotPage() {
  const toast = useToast();
  const { t } = useI18n();
  const qc = useQueryClient();

  const { data } = useQuery<BotConfig>({ queryKey: ["bot"], queryFn: api.getBot });

  const [enabled, setEnabled] = React.useState(false);
  const [token, setToken] = React.useState("");
  const [chatIds, setChatIds] = React.useState<string[]>([""]);
  const [dailyBackup] = React.useState(true);
  const [showToken, setShowToken] = React.useState(false);

  React.useEffect(() => {
    if (!data) return;
    setEnabled(data.enabled);
    setToken(data.token);
    setChatIds(data.chatIds.length ? data.chatIds : [""]);
  }, [data]);

  const cleanIds = () => chatIds.map((c) => c.trim()).filter(Boolean);

  const saveMut = useMutation({
    mutationFn: () => api.saveBot({ enabled, token, chatIds: cleanIds(), dailyBackup }),
    onSuccess: () => {
      toast.push("success", t("botSaved"));
      qc.invalidateQueries({ queryKey: ["bot"] });
    },
    onError: (e: Error) => toast.push("error", e.message),
  });

  const testMut = useMutation({
    mutationFn: () => api.testBot(token, cleanIds()),
    onSuccess: () => toast.push("success", "Test message sent — check your Telegram"),
    onError: (e: Error) => toast.push("error", e.message),
  });

  const isOn = !!data?.enabled && !!data?.token;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Bot}
        accent="#a3e635"
        title={t("telegramBot")}
        description={t("botDesc")}
      />

      <div
        className={cn(
          "card-lift flex animate-rise items-center gap-3 overflow-hidden rounded-base border-2 border-border neo-shadow",
          isOn ? "bg-lime-300/20" : "bg-yellow-300/20",
        )}
      >
        <div className={cn("h-full w-1.5 self-stretch", isOn ? "bg-main" : "bg-yellow-300")} />
        <div className="flex min-w-0 flex-1 items-center gap-3 py-4 pr-4">
          <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-base border-2 border-border bg-bg">
            <span
              className={cn(
                "absolute h-3 w-3 rounded-full",
                isOn && "animate-ping bg-lime-400",
              )}
            />
            <CircleCheck
              className={cn("relative h-5 w-5", isOn ? "text-lime-500" : "text-yellow-500")}
            />
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-heading">{isOn ? t("botOn") : t("botOff")}</div>
            <div className="truncate text-xs text-text/60">
              {isOn ? t("botOnDesc") : t("botOffDesc")}
            </div>
          </div>
          <Badge variant={isOn ? "success" : "warning"} className="shrink-0">
            {isOn ? t("running") : t("stopped")}
          </Badge>
        </div>
      </div>

      <Card className="card-lift overflow-hidden">
        <div className="h-1.5 w-full bg-[#a3e635]" />
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-main" />
            <CardTitle>{t("botConfig")}</CardTitle>
          </div>
          <CardDescription>
            {t("botConfigDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between gap-3 rounded-base border-2 border-border bg-lime-300/15 p-3">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-base border-2 border-border bg-[#a3e635]">
                <ShieldCheck className="h-4 w-4 text-black" />
              </span>
              <span className="font-heading text-sm">{t("enableBot")}</span>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="token">{t("botToken")}</Label>
            <div className="relative">
              <Input
                id="token"
                type={showToken ? "text" : "password"}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder={t("botTokenPlaceholder")}
                autoComplete="off"
                className="pr-11"
              />
              <button
                type="button"
                onClick={() => setShowToken((v) => !v)}
                title={showToken ? t("hide") : t("show")}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-[4px] border-2 border-transparent p-1.5 text-text/50 transition-all hover:border-border hover:text-text"
              >
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t("chatIds")}</Label>
              <Button
                type="button"
                variant="neutral"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setChatIds((p) => [...p, ""])}
              >
                <Plus className="h-3.5 w-3.5" />{t("add")}
              </Button>
            </div>
            <div className="space-y-2">
              {chatIds.map((cid, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={cid}
                    onChange={(e) =>
                      setChatIds((p) => p.map((v, idx) => (idx === i ? e.target.value : v)))
                    }
                    placeholder={t("chatIdPlaceholder")}
                  />
                  {chatIds.length > 1 && (
                    <Button
                      type="button"
                      variant="danger"
                      size="icon"
                      onClick={() => setChatIds((p) => p.filter((_, idx) => idx !== i))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-[11px] text-text/50">
              {t("chatIdHint")}
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-base border-2 border-border bg-sky-300/15 p-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-base border-2 border-border bg-[#7dd3fc]">
              <Archive className="h-4 w-4 text-black" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-heading text-sm">{t("dailyBackup")}</div>
              <div className="text-[11px] text-text/50">
                {t("dailyBackupDesc")}
              </div>
            </div>
            <Badge variant="success" className="shrink-0 gap-1">
              <CircleCheck className="h-3.5 w-3.5" />
              {t("always")}
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button
              className="w-full"
              onClick={() => saveMut.mutate()}
              disabled={saveMut.isPending}
            >
              <Save className="h-4 w-4" />{t("save")}
            </Button>
            <Button
              variant="neutral"
              className="w-full"
              onClick={() => testMut.mutate()}
              disabled={testMut.isPending || !token || cleanIds().length === 0}
            >
              <Send className="h-4 w-4" />
              {testMut.isPending ? t("sending") : t("sendTest")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
