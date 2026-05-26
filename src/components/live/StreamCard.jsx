'use client';

import * as Player from '@livepeer/react/player';
import {
  FaCopy,
  FaExternalLinkAlt,
  FaPlay,
  FaStopCircle,
  FaTelegram,
  FaTrash,
  FaYoutube,
} from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtu.be']);

export function getYouTubeVideoId(url) {
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    const host = u.hostname.toLowerCase();
    if (!YOUTUBE_HOSTS.has(host)) return null;
    if (host === 'youtu.be') {
      const id = u.pathname.replace(/^\//, '').split('/')[0] || '';
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }
    if (u.pathname.startsWith('/watch') || u.pathname.startsWith('/live')) {
      const v = u.searchParams.get('v') || '';
      return /^[a-zA-Z0-9_-]{11}$/.test(v) ? v : null;
    }
    if (u.pathname.startsWith('/embed/')) {
      const id = u.pathname.split('/embed/')[1]?.split('/')[0] || '';
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function isYouTubePlayback(playbackId) {
  return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i.test(String(playbackId || '').trim());
}

function socialXUrl(handle) {
  const h = String(handle || '').trim().replace(/^@/, '');
  return h ? `https://x.com/${encodeURIComponent(h)}` : null;
}

function socialTelegramUrl(username) {
  const u = String(username || '').trim().replace(/^@/, '');
  return u ? `https://t.me/${encodeURIComponent(u)}` : null;
}

function liveDotClass(playbackId, metrics, isYoutube) {
  if (isYoutube) {
    return { ping: false, cls: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' };
  }
  const m = metrics[playbackId];
  const v = m?.viewers;
  const n = typeof v === 'number' ? v : typeof v === 'string' && v !== '—' ? Number(v) : NaN;
  if (Number.isFinite(n) && n > 0) return { ping: false, cls: 'bg-emerald-500' };
  if (m && v !== undefined) return { ping: false, cls: 'bg-amber-400' };
  return { ping: true, cls: 'bg-red-500' };
}

function LiveStatusDot({ playbackId, metrics, isYoutube, isLive }) {
  const { ping, cls } = liveDotClass(playbackId, metrics, isYoutube);
  return (
    <span className="inline-flex items-center gap-1.5 shrink-0">
      <span className="relative flex h-2 w-2">
        {ping && isLive && (
          <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping" />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${cls}`} />
      </span>
      {isLive ? (
        <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">Live</span>
      ) : (
        <span className="text-[10px] font-medium uppercase tracking-wider text-white/35">Ended</span>
      )}
    </span>
  );
}

function StreamSocialPills({ xHandle, telegramUsername }) {
  const xUrl = socialXUrl(xHandle);
  const tgUrl = socialTelegramUrl(telegramUsername);
  if (!xUrl && !tgUrl) return null;

  return (
    <div
      className="flex flex-wrap gap-2"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      {xUrl && (
        <a
          href={xUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[11px] font-medium text-white/75 hover:border-sky-500/40 hover:bg-sky-500/10 hover:text-sky-200 transition-colors"
        >
          <FaXTwitter className="text-sky-400/90" size={11} />
          @{String(xHandle).replace(/^@/, '')}
        </a>
      )}
      {tgUrl && (
        <a
          href={tgUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[11px] font-medium text-white/75 hover:border-cyan-500/40 hover:bg-cyan-500/10 hover:text-cyan-200 transition-colors"
        >
          <FaTelegram className="text-cyan-400/90" size={11} />
          @{String(telegramUsername).replace(/^@/, '')}
        </a>
      )}
    </div>
  );
}

function StreamMetrics({ playbackId, metrics, isYoutube }) {
  const m = metrics[playbackId];
  const viewers = isYoutube ? 'YouTube' : (m?.viewers ?? '—');
  const bitrate = m?.bitrate && m.bitrate !== '—' ? `${m.bitrate} kbps` : isYoutube ? '—' : '—';

  return (
    <div className="grid grid-cols-2 gap-2 text-center">
      <div className="rounded-lg border border-white/[0.08] bg-black/30 px-2 py-1.5">
        <p className="text-[9px] uppercase tracking-wider text-white/40">Viewers</p>
        <p className="text-xs font-semibold text-white/85 tabular-nums">{viewers}</p>
      </div>
      <div className="rounded-lg border border-white/[0.08] bg-black/30 px-2 py-1.5">
        <p className="text-[9px] uppercase tracking-wider text-white/40">Bitrate</p>
        <p className="text-xs font-semibold text-white/85 tabular-nums">{bitrate}</p>
      </div>
    </div>
  );
}

function StreamPosterPreview({ posterUrl, watchUrl, isYoutube }) {
  return (
    <div className="relative w-full aspect-video overflow-hidden bg-[#0a0008]">
      {posterUrl ? (
        <img
          src={posterUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950/80 via-[#0e0010] to-fuchsia-950/40" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 pointer-events-none">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 border border-white/20 backdrop-blur-sm shadow-lg">
          {isYoutube ? (
            <FaYoutube className="text-red-500" size={22} />
          ) : (
            <FaPlay className="text-white ml-0.5" size={18} />
          )}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
          {isYoutube ? 'Watch on YouTube' : 'Open stream'}
          <FaExternalLinkAlt size={10} className="opacity-70" />
        </span>
      </div>
      <a
        href={watchUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute inset-0 z-10"
        aria-label={isYoutube ? 'Watch on YouTube' : 'Open stream'}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

export default function StreamCard({
  stream,
  idx,
  metrics,
  ytMeta,
  isOwner,
  copiedId,
  endingId,
  watchUrl,
  getSrcFor,
  onCopy,
  onRemove,
  onEnd,
  onCardOpen,
}) {
  const {
    id,
    playbackId,
    title,
    thumbnailUrl,
    isLive,
    durationMinutes,
    rewardTierPct,
    xHandle: sx,
    telegramUsername: stg,
  } = stream;

  const isYoutube = isYouTubePlayback(playbackId);
  const meta = ytMeta[playbackId];
  const displayTitle = title || meta?.title || (isYoutube ? 'YouTube Live' : 'Live stream');
  const channel = meta?.author_name;
  const videoId = isYoutube
    ? getYouTubeVideoId(playbackId.startsWith('http') ? playbackId : `https://${playbackId}`)
    : null;
  const posterUrl =
    thumbnailUrl ||
    meta?.thumbnail_url ||
    (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null);

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onCardOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onCardOpen();
        }
      }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-b from-[#140012]/90 to-[#0a0008]/95 shadow-lg transition-all hover:-translate-y-0.5 hover:border-purple-400/40 hover:shadow-[0_20px_50px_-20px_rgba(168,85,247,0.35)] cursor-pointer fade-in-up"
      style={{ animationDelay: `${idx * 80}ms` }}
    >
      <div
        className="relative rounded-t-2xl overflow-hidden ring-1 ring-inset ring-white/5"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {isYoutube ? (
          <StreamPosterPreview posterUrl={posterUrl} watchUrl={watchUrl} isYoutube />
        ) : (
          <div className="relative w-full aspect-video bg-black">
            <Player.Root src={getSrcFor(playbackId)}>
              <Player.Container className="w-full aspect-video pointer-events-none">
                <Player.Video title={displayTitle} />
              </Player.Container>
            </Player.Root>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
            <a
              href={watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-sm hover:bg-white/20 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              Open stream <FaExternalLinkAlt size={10} />
            </a>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div
          className="flex items-start justify-between gap-2"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <LiveStatusDot playbackId={playbackId} metrics={metrics} isYoutube={isYoutube} isLive={isLive} />
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                  isYoutube
                    ? 'bg-red-500/15 text-red-300 border border-red-500/25'
                    : 'bg-purple-500/15 text-purple-200 border border-purple-500/25'
                }`}
              >
                {isYoutube ? <FaYoutube size={10} /> : null}
                {isYoutube ? 'YouTube' : 'Livepeer'}
              </span>
              {(durationMinutes > 0 || rewardTierPct > 0) && (
                <span className="text-[10px] text-white/40">
                  {durationMinutes > 0 ? `${durationMinutes}m` : ''}
                  {rewardTierPct > 0 ? `${durationMinutes > 0 ? ' · ' : ''}${rewardTierPct}% tier` : ''}
                </span>
              )}
            </div>
            <h3 className="font-display text-sm font-semibold text-white leading-snug line-clamp-2" title={displayTitle}>
              {displayTitle}
            </h3>
            {channel ? <p className="text-[11px] text-white/45 mt-0.5 truncate">{channel}</p> : null}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              title={copiedId === (id || playbackId) ? 'Copied!' : 'Copy stream URL'}
              onClick={() => onCopy(playbackId, id)}
              className={`flex h-8 w-8 items-center justify-center rounded-lg border bg-white/[0.04] transition-colors ${
                copiedId === (id || playbackId)
                  ? 'border-emerald-500/40 text-emerald-300'
                  : 'border-white/10 text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <FaCopy size={12} />
              <span className="sr-only">{copiedId === (id || playbackId) ? 'Copied' : 'Copy'}</span>
            </button>
            {isOwner && isLive && (
              <button
                type="button"
                title="End live session"
                onClick={() => onEnd(stream)}
                disabled={endingId === id}
                className="flex h-8 items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 text-[11px] font-medium text-amber-200 hover:bg-amber-500/20 disabled:opacity-50"
              >
                <FaStopCircle size={11} />
                {endingId === id ? '…' : 'End'}
              </button>
            )}
          </div>
        </div>

        <StreamSocialPills xHandle={sx} telegramUsername={stg} />

        <StreamMetrics playbackId={playbackId} metrics={metrics} isYoutube={isYoutube} />

        {isOwner && !isLive && (
          <button
            type="button"
            onClick={() => onRemove({ id, playbackId })}
            className="mt-auto flex w-full items-center justify-center gap-1.5 rounded-lg border border-transparent py-1.5 text-[11px] text-white/35 hover:border-rose-500/20 hover:bg-rose-500/10 hover:text-rose-300/90 transition-colors"
          >
            <FaTrash size={10} />
            Remove from directory
          </button>
        )}
      </div>
    </article>
  );
}
