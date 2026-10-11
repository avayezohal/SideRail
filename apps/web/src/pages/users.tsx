import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  UserPlus,
  Users2,
  Wifi,
  ShieldCheck,
  BatteryWarning,
  Pencil,
  Trash2,
  Link2,
  RotateCcw,
  RefreshCw,
  MoreVertical,
  Copy,
  Server,
  Tag,
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/page-header";
import { UserFormDialog } from "@/components/users/user-form-dialog";
import { Infinity as InfinityIcon, Crown, UserRound } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { formatBytes, relativeTime, cn } from "@/lib/utils";
import type { Inbound, User, UserFormValues, UserSummary } from "@/lib/types";

function SummaryCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <Card className="card-lift animate-rise overflow-hidden">
      <div className="h-1.5 w-full" style={{ background: accent }} />
      <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
        <div
          className="grid h-11 w-11 shrink-0 place-items-center rounded-base border-2 border-border sm:h-12 sm:w-12"
          style={{ background: accent }}
        >
          <Icon className="h-5 w-5 text-black sm:h-6 sm:w-6" />
        </div>
        <div className="min-w-0">
          <div className="font-heading text-2xl leading-none sm:text-3xl">{value}</div>
          <div className="mt-1 truncate text-[9px] font-heading uppercase tracking-widest text-text/60 sm:text-xs">
            {label}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TrafficBar({ user }: { user: User }) {
  const usagePct = user.data_limit > 0 ? Math.min(100, (user.total / user.data_limit) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2 text-xs font-base text-text/70">
        <span className="font-heading text-text/90">{formatBytes(user.total)}</span>
        {user.data_limit > 0 && <span>{formatBytes(user.data_limit)}</span>}
      </div>
      <Progress
        value={user.data_limit > 0 ? usagePct : 100}
        className="h-2"
        indicatorClassName={
          usagePct > 90 ? "bg-red-400" : usagePct > 70 ? "bg-yellow-400" : "bg-main"
        }
      />
      <div className="flex items-center gap-3 text-[11px] font-base">
        <span className="text-lime-500">↓ {formatBytes(user.down)}</span>
        <span className="text-sky-400">↑ {formatBytes(user.up)}</span>
      </div>
    </div>
  );
}

let onlineLabel = "Online";
let offlineLabel = "Offline";

export default function UsersPage() {
  const toast = useToast();
  const qc = useQueryClient();
  const { t } = useI18n();
  onlineLabel = t("online");
  offlineLabel = t("offline");
  const { isOwner } = useAuth();
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<User | null>(null);

  const { data } = useQuery<{ users: User[]; summary: UserSummary }>({
    queryKey: ["users"],
    queryFn: api.users,
    refetchInterval: 5000,
  });
  const { data: inbounds = [] } = useQuery<Inbound[]>({
    queryKey: ["inbounds"],
    queryFn: api.inbounds,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["users"] });

  const createMut = useMutation({
    mutationFn: (v: UserFormValues) => api.createUser(v),
    onSuccess: () => {
      toast.push("success", t("userCreated"));
      setFormOpen(false);
      invalidate();
    },
    onError: (e: Error) => toast.push("error", e.message),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, v }: { id: number; v: UserFormValues }) => api.updateUser(id, v),
    onSuccess: () => {
      toast.push("success", t("userUpdated"));
      setFormOpen(false);
      setEditing(null);
      invalidate();
    },
    onError: (e: Error) => toast.push("error", e.message),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, enabled }: { id: number; enabled: boolean }) => api.toggleUser(id, enabled),
    onSuccess: invalidate,
    onError: (e: Error) => toast.push("error", e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.deleteUser(id),
    onSuccess: () => {
      toast.push("success", t("userDeleted"));
      setDeleteTarget(null);
      invalidate();
    },
    onError: (e: Error) => toast.push("error", e.message),
  });

  const resetMut = useMutation({
    mutationFn: (id: number) => api.resetTraffic(id),
    onSuccess: () => {
      toast.push("success", t("trafficReset"));
      invalidate();
    },
  });

  const rotateMut = useMutation({
    mutationFn: (id: number) => api.rotateToken(id),
    onSuccess: () => {
      toast.push("success", t("tokenRotated"));
      invalidate();
    },
  });

  const users = data?.users ?? [];
  const summary = data?.summary ?? { clients: 0, online: 0, active: 0, depleting: 0 };

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (u: User) => {
    setEditing(u);
    setFormOpen(true);
  };

  const copySubLink = (u: User) => {
    const url = `${window.location.origin}/sub/${u.sub_token}`;
    void navigator.clipboard.writeText(url);
    toast.push("success", t("subLinkCopied"));
  };

  const inboundName = (id: number) => inbounds.find((i) => i.id === id)?.tag || `#${id}`;

  const avatarColors = ["#a3e635", "#7dd3fc", "#fbbf24", "#38bdf8", "#86efac", "#22d3ee", "#facc15"];
  const avatarColor = (name: string) => {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    return avatarColors[h % avatarColors.length];
  };

  const inboundTags = (u: User) => {
    const ids = u.inbound_ids;
    const odd = ids.length % 2 === 1;
    return (
      <div className="grid grid-cols-2 gap-1.5">
        {ids.length === 0 && (
          <span className="col-span-2 rounded-base border-2 border-dashed border-border/40 py-2 text-center text-[10px] uppercase tracking-widest text-text/40">
            {t("none")}
          </span>
        )}
        {ids.map((id, idx) => (
          <span
            key={id}
            className={cn(
              "flex min-w-0 items-center gap-1.5 rounded-base border-2 border-border bg-bg/40 px-2.5 py-2",
              odd && idx === ids.length - 1 && "col-span-2 justify-center bg-sky-300/15",
            )}
            title={inboundName(id)}
          >
            <Server className="h-3.5 w-3.5 shrink-0 text-sky-400" />
            <span className="truncate font-heading text-xs">{inboundName(id)}</span>
          </span>
        ))}
      </div>
    );
  };

  const UserCard = ({ u }: { u: User }) => {
    const ac = avatarColor(u.email);
    return (
      <Card className="card-lift animate-rise flex flex-col overflow-hidden">
        <div className="h-1.5 w-full shrink-0" style={{ background: u.online ? ac : undefined }}>
          {!u.online && <div className="h-full w-full bg-border/40" />}
        </div>
        <CardContent className="flex flex-1 flex-col gap-2.5 p-3.5">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div
                className="grid h-12 w-12 shrink-0 place-items-center rounded-base border-2 border-border text-black"
                style={{ background: ac }}
              >
                <UserRound className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-heading text-base" title={u.email}>
                  {u.email}
                </div>
                <span
                  className={cn(
                    "mt-1 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-heading uppercase tracking-wide",
                    u.online ? "bg-lime-300/20 text-lime-600 dark:text-lime-300" : "bg-bw text-text/50",
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-2 w-2 rounded-full",
                      u.online ? "animate-pulse bg-lime-400" : "bg-zinc-500",
                    )}
                  />
                  {u.online ? onlineLabel : offlineLabel}
                </span>
              </div>
            </div>
            <div className="flex shrink-0 items-start">
              <Switch
                checked={!!u.enabled}
                onCheckedChange={(v) => toggleMut.mutate({ id: u.id, enabled: v })}
              />
            </div>
          </div>

          {(u.comment || (isOwner && u.creator)) && (
            <div className="flex flex-wrap items-center gap-1.5">
              {isOwner && u.creator && (
                <Badge
                  variant="neutral"
                  className={cn(
                    "gap-1 text-[11px]",
                    u.creatorRole === "owner"
                      ? "bg-yellow-300/20 text-yellow-700 dark:text-yellow-300"
                      : "bg-sky-300/20 text-sky-700 dark:text-sky-300",
                  )}
                >
                  {u.creatorRole === "owner" ? (
                    <Crown className="h-3 w-3 shrink-0" />
                  ) : (
                    <ShieldCheck className="h-3 w-3 shrink-0" />
                  )}
                  <span className="max-w-[120px] truncate">{u.creator}</span>
                </Badge>
              )}
              {u.comment && (
                <Badge
                  variant="neutral"
                  className={cn(
                    "gap-1 text-[11px]",
                    u.comment === "system" &&
                      "bg-lime-300/20 text-lime-700 dark:text-lime-300",
                  )}
                >
                  <Tag className="h-3 w-3 shrink-0" />
                  <span className="max-w-[140px] truncate">{u.comment}</span>
                </Badge>
              )}
            </div>
          )}

          {inboundTags(u)}

          <div className="rounded-base border-2 border-border bg-bg/40 p-2.5">
            <TrafficBar user={u} />
          </div>

          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-base border-2 border-border bg-lime-300/15 py-1.5">
              <div className="flex items-center justify-center gap-1 font-heading text-sm">
                {u.data_limit <= 0 ? (
                  <InfinityIcon className="h-4 w-4" />
                ) : (
                  formatBytes(Math.max(0, u.data_limit - u.total))
                )}
              </div>
              <div className="truncate px-1 text-[10px] uppercase tracking-widest text-text/50">
                {t("remaining")}
              </div>
            </div>
            <div className="rounded-base border-2 border-border bg-sky-300/15 py-1.5">
              <div className="flex items-center justify-center gap-1 font-heading text-sm">
                {u.expire_at ? relativeTime(u.expire_at) : <InfinityIcon className="h-4 w-4" />}
              </div>
              <div className="truncate px-1 text-[10px] uppercase tracking-widest text-text/50">
                {t("expires")}
              </div>
            </div>
          </div>

          <div className="mt-auto grid grid-cols-3 gap-2 pt-0.5">
            <Button variant="neutral" onClick={() => openEdit(u)} className="w-full">
              <Pencil className="h-4 w-4 shrink-0" />
              <span className="truncate">{t("edit")}</span>
            </Button>
            <Button variant="neutral" onClick={() => copySubLink(u)} className="w-full">
              <Link2 className="h-4 w-4 shrink-0" />
              <span className="truncate">{t("copy")}</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="neutral" className="w-full">
                  <MoreVertical className="h-4 w-4 shrink-0" />
                  <span className="truncate">{t("more")}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => copySubLink(u)}>
                  <Copy className="h-4 w-4" />{t("copySubLink")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open(`/sub/${u.sub_token}`, "_blank")}>
                  <Server className="h-4 w-4" />{t("openSubPage")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => resetMut.mutate(u.id)}>
                  <RotateCcw className="h-4 w-4" />{t("resetTraffic")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => rotateMut.mutate(u.id)}>
                  <RefreshCw className="h-4 w-4" />{t("rotateSubToken")}
              </DropdownMenuItem>
              <DropdownMenuItem danger onClick={() => setDeleteTarget(u)}>
                <Trash2 className="h-4 w-4" />{t("delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Users2}
        accent="#7dd3fc"
        title={t("users")}
        description={t("manageClients")}
        actions={
          <Button onClick={openNew} className="w-full sm:w-auto">
            <UserPlus className="h-4 w-4" />{t("newUser")}
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <SummaryCard icon={Users2} label={t("clients")} value={summary.clients} accent="#a3e635" />
        <SummaryCard icon={Wifi} label={t("online")} value={summary.online} accent="#7dd3fc" />
        <SummaryCard icon={ShieldCheck} label={t("active")} value={summary.active} accent="#86efac" />
        <SummaryCard
          icon={BatteryWarning}
          label={t("depleting")}
          value={summary.depleting}
          accent="#fbbf24"
        />
      </div>

      {users.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center text-text/50">{t("noUsers")}</CardContent>
        </Card>
      )}

      <div className="grid min-w-0 gap-3 sm:gap-4 md:grid-cols-2">
        {users.map((u, idx) => (
          <div
            key={u.id}
            className={cn(users.length % 2 === 1 && idx === users.length - 1 && "md:col-span-2")}
          >
            <UserCard u={u} />
          </div>
        ))}
      </div>

      <UserFormDialog
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditing(null);
        }}
        inbounds={inbounds}
        editing={editing}
        onSubmit={async (v) => {
          if (editing) await updateMut.mutateAsync({ id: editing.id, v });
          else await createMut.mutateAsync(v);
        }}
      />

      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("deleteUser")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm font-base text-text/70">
            {t("deleteUserConfirm")}{" "}
            <span className="font-heading text-text">{deleteTarget?.email}</span>? {t("cannotUndo")}
          </p>
          <DialogFooter>
            <Button variant="neutral" onClick={() => setDeleteTarget(null)}>
              {t("cancel")}
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}
            >
              <Trash2 className="h-4 w-4" />{t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


