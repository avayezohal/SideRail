import * as React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Cpu,
  MemoryStick,
  HardDrive,
  Layers,
  Download,
  Upload,
  Archive,
  CircleCheck,
  CircleX,
  RotateCw,
  Globe,
  LayoutDashboard,
  MapPin,
  Wifi,
  Copy,
} from "lucide-react";
import { api, exportBackupUrl } from "@/lib/api";
import { formatBytes, pct, cn, d } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import type { SystemStats } from "@/lib/types";

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  progress,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
  progress: number;
  accent: string;
}) {
  return (
    <Card className="card-lift animate-rise overflow-hidden">
      <div className="h-1.5 w-full" style={{ background: accent }} />
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-text/70">
              <Icon className="h-4 w-4" />
              <span className="text-xs font-heading uppercase tracking-widest">{label}</span>
            </div>
            <div className="mt-2 font-heading text-3xl">{value}</div>
          </div>
          <div
            className="grid h-10 w-10 place-items-center rounded-base border-2 border-border"
            style={{ background: accent }}
          >
            <Icon className="h-5 w-5 text-black" />
          </div>
        </div>
        <div className="mt-4">
          <Progress value={progress} indicatorClassName="" />
          <div className="mt-2 text-xs font-base text-text/60">{sub}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function ServerInfoCard({ s }: { s: SystemStats }) {
  const toast = useToast();
  const { t } = useI18n();

  const copyIp = () => {
    void navigator.clipboard.writeText(s.ip.address);
    toast.push("success", t("copied"));
  };

  const fields: {
    icon: React.ElementType;
    label: string;
    value: string;
    accent: string;
    copy?: boolean;
  }[] = [
    {
      icon: Globe,
      label: t("serverIp"),
      value: s.ip.address || t("unknown"),
      accent: "#a3e635",
      copy: !!s.ip.address,
    },
    { icon: MapPin, label: t("location"), value: s.ip.location || t("unknown"), accent: "#7dd3fc" },
    { icon: Wifi, label: t("isp"), value: s.ip.isp || t("unknown"), accent: "#fbbf24" },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {fields.map((f) => (
        <Card key={f.label} className="card-lift animate-rise overflow-hidden">
          <div className="h-1.5 w-full" style={{ background: f.accent }} />
          <CardContent className="flex items-center gap-3 p-4">
            <div
              className="grid h-10 w-10 shrink-0 place-items-center rounded-base border-2 border-border"
              style={{ background: f.accent }}
            >
              <f.icon className="h-5 w-5 text-black" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] uppercase tracking-widest text-text/50">{f.label}</div>
              <div className="flex min-w-0 items-center gap-1.5">
                <div className="truncate font-heading" title={f.value}>
                  {f.value}
                </div>
                {f.copy && (
                  <button
                    onClick={copyIp}
                    title={t("copy")}
                    className="shrink-0 rounded-[4px] border-2 border-transparent p-0.5 text-text/50 transition-all hover:border-border hover:text-text"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const toast = useToast();
  const { t } = useI18n();
  const { data } = useQuery<SystemStats>({
    queryKey: ["system"],
    queryFn: api.system,
    refetchInterval: 3000,
  });
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [importing, setImporting] = React.useState(false);

  const s = data;

  const restartMut = useMutation({
    mutationFn: () => api.restartXray(),
    onSuccess: () => toast.push("success", t("xrayRestarted")),
    onError: (e: Error) => toast.push("error", e.message),
  });

  const onExport = () => {
    window.open(exportBackupUrl(), "_blank");
    toast.push("success", t("backupExportStarted"));
  };

  const onImportClick = () => fileRef.current?.click();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      await api.importBackup(json);
      toast.push("success", t("backupImported"));
    } catch (err) {
      toast.push("error", (err as Error).message || t("invalidBackup"));
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={LayoutDashboard}
        accent="#a3e635"
        title={t("dashboard")}
        description={t("liveMetrics")}
        actions={
          <>
            <Badge
              variant={s?.xray.running ? "success" : "danger"}
              className="h-10 justify-center gap-1.5 px-4 text-sm"
            >
              {s?.xray.running ? (
                <CircleCheck className="h-4 w-4 shrink-0" />
              ) : (
                <CircleX className="h-4 w-4 shrink-0" />
              )}
              <span className="truncate">{d("WHJheQ==")} · {s?.xray.running ? t("running") : t("stopped")}</span>
            </Badge>
            <Button
              variant="neutral"
              className="h-10 justify-center gap-1.5 px-4 text-sm sm:w-auto"
              onClick={() => restartMut.mutate()}
              disabled={restartMut.isPending}
            >
              <RotateCw className={cn("h-4 w-4 shrink-0", restartMut.isPending && "animate-spin")} />
              <span className="truncate">{t("restartXray")}</span>
            </Button>
          </>
        }
      />

      {s && <ServerInfoCard s={s} />}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Cpu}
          label={t("cpu")}
          value={pct(s?.cpu.usage ?? 0)}
          sub={`${s?.cpu.cores ?? 0} ${t("cores")} · ${t("avg")} ${pct(s?.cpu.avg ?? 0)}`}
          progress={s?.cpu.usage ?? 0}
          accent="#a3e635"
        />
        <StatCard
          icon={MemoryStick}
          label={t("ram")}
          value={pct(s?.ram.usage ?? 0)}
          sub={`${formatBytes(s?.ram.used ?? 0)} / ${formatBytes(s?.ram.total ?? 0)}`}
          progress={s?.ram.usage ?? 0}
          accent="#7dd3fc"
        />
        <StatCard
          icon={Layers}
          label={t("swap")}
          value={pct(s?.swap.usage ?? 0)}
          sub={`${formatBytes(s?.swap.used ?? 0)} / ${formatBytes(s?.swap.total ?? 0)}`}
          progress={s?.swap.usage ?? 0}
          accent="#fbbf24"
        />
        <StatCard
          icon={HardDrive}
          label={t("storage")}
          value={pct(s?.storage.usage ?? 0)}
          sub={`${t("free")} ${formatBytes(s?.storage.free ?? 0)}`}
          progress={s?.storage.usage ?? 0}
          accent="#38bdf8"
        />
      </div>

      <Card className="card-lift">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-main" />
            <CardTitle>{t("backupRestore")}</CardTitle>
          </div>
          <CardDescription>{t("backupDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              onClick={onExport}
              className="group flex items-center gap-3 rounded-base border-2 border-border bg-main/10 p-4 text-left transition-all hover:-translate-y-0.5 hover:bg-main/20"
            >
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-base border-2 border-border bg-main">
                <Download className="h-5 w-5 text-black" />
              </div>
              <div>
                <div className="font-heading">{t("exportBackup")}</div>
                <div className="text-xs text-text/60">{t("exportBackupDesc")}</div>
              </div>
            </button>
            <button
              onClick={onImportClick}
              disabled={importing}
              className="group flex items-center gap-3 rounded-base border-2 border-border bg-sky-300/10 p-4 text-left transition-all hover:-translate-y-0.5 hover:bg-sky-300/20 disabled:opacity-50"
            >
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-base border-2 border-border bg-sky-300">
                <Upload className="h-5 w-5 text-black" />
              </div>
              <div>
                <div className="font-heading">{importing ? t("importing") : t("importBackup")}</div>
                <div className="text-xs text-text/60">{t("importBackupDesc")}</div>
              </div>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={onFile}
            />
          </div>
          <p className="mt-3 text-xs font-base text-text/50">{t("importWarning")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
