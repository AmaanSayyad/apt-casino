"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { usePlayWallet } from "@/hooks/usePlayWallet";
import { normalizeWalletForChain, walletsMatch } from "@/lib/server/referrals";
import StreamCard from "@/components/live/StreamCard";

function isYouTubeUrl(url) {
  return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i.test(url);
}

/** Public watch URL (opens in new tab). */
function streamWatchUrl(playbackId) {
  const trimmed = String(playbackId || "").trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (isYouTubeUrl(trimmed)) return `https://${trimmed}`;
  return `https://livepeercdn.com/hls/${trimmed}/index.m3u8`;
}

/** Preview thumbnail from a local File only (src set via ref, not user-controlled strings). */
function ThumbnailPreview({ file }) {
  const imgRef = useRef(null);

  useEffect(() => {
    const img = imgRef.current;
    if (!file || !img) return undefined;
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  if (!file) return null;
  return (
    <img
      ref={imgRef}
      alt="Thumbnail preview"
      className="mt-2 h-20 rounded-lg object-cover border border-white/10"
    />
  );
}

export default function LivePage() {
  const play = usePlayWallet();
  const connected = play.connected;
  const wallet =
    connected && play.address ? normalizeWalletForChain(play.address, play.chain) : null;

  const [streams, setStreams] = useState([]);
  const [listSource, setListSource] = useState("loading");
  const [newPlaybackId, setNewPlaybackId] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [xHandle, setXHandle] = useState("");
  const [telegramUsername, setTelegramUsername] = useState("");
  const [solanaPayoutWallet, setSolanaPayoutWallet] = useState("");
  const [showStreamerForm, setShowStreamerForm] = useState(false);
  const [errorModal, setErrorModal] = useState({ open: false, message: "" });
  const [infoModal, setInfoModal] = useState({ open: false, message: "" });
  const [copiedId, setCopiedId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [endingId, setEndingId] = useState(null);

  const [metrics, setMetrics] = useState({});
  const [ytMeta, setYtMeta] = useState({});
  const [guideOpen, setGuideOpen] = useState(false);

  const loadStreams = useCallback(async () => {
    try {
      const res = await fetch("/api/streams?limit=60", { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStreams([]);
        setListSource("empty");
        return;
      }
      const list = Array.isArray(json.streams) ? json.streams : [];
      setStreams(list);
      setListSource(list.length > 0 ? "api" : "empty");
    } catch {
      setStreams([]);
      setListSource("empty");
    }
  }, []);

  useEffect(() => {
    void loadStreams();
  }, [loadStreams]);

  const myLiveSession = streams.find(
    (s) => s.isLive && wallet && s.wallet && walletsMatch(s.wallet, wallet, play.chain),
  );

  useEffect(() => {
    if (!myLiveSession?.id || !wallet) return;
    const ping = () => {
      void fetch(`/api/streams/${myLiveSession.id}/heartbeat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet }),
      }).then(() => loadStreams());
    };
    ping();
    const timer = setInterval(ping, 45_000);
    return () => clearInterval(timer);
  }, [myLiveSession?.id, wallet, loadStreams]);

  function onThumbnailPick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) return;
    setThumbnailFile(file);
  }

  async function addStream() {
    const id = newPlaybackId.trim();
    if (!id) return;
    if (!connected || !wallet) {
      setErrorModal({ open: true, message: "Connect your wallet (Solana · Aptos) to go live." });
      return;
    }
    if (myLiveSession) {
      setErrorModal({ open: true, message: "End your current live session before starting a new one." });
      return;
    }

    const yt = isYouTubeUrl(id);
    if (!yt) {
      const res = await fetch(`/api/livepeer/validate?id=${encodeURIComponent(id)}`, { cache: "no-store" });
      const json = await res.json();
      if (!json?.ok) {
        setErrorModal({
          open: true,
          message: "Stream is not reachable. Please check the Playback ID or HLS URL.",
        });
        return;
      }
    }

    setAdding(true);
    try {
      let thumbnailUrl = null;
      if (thumbnailFile) {
        const fd = new FormData();
        fd.append("file", thumbnailFile);
        const up = await fetch("/api/streams/thumbnail", { method: "POST", body: fd });
        const upJson = await up.json().catch(() => ({}));
        if (!up.ok) {
          const proceed = window.confirm(
            `${upJson.error || "Thumbnail upload failed."}\n\nGo live without a thumbnail?`,
          );
          if (!proceed) return;
        } else {
          thumbnailUrl = upJson.url;
        }
      }

      const res = await fetch("/api/streams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet,
          playbackId: id,
          thumbnailUrl,
          xHandle: xHandle.trim() || null,
          telegramUsername: telegramUsername.trim() || null,
          solanaPayoutWallet: solanaPayoutWallet.trim() || null,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorModal({ open: true, message: json.error || "Could not go live." });
        return;
      }
      setNewPlaybackId("");
      setThumbnailFile(null);
      setXHandle("");
      setTelegramUsername("");
      setSolanaPayoutWallet("");
      setShowStreamerForm(false);
      if (json.message) {
        setInfoModal({ open: true, message: json.message });
      }
      await loadStreams();
    } catch {
      setErrorModal({ open: true, message: "Network error while going live." });
    } finally {
      setAdding(false);
    }
  }

  async function endLiveSession(row) {
    if (!row?.id || !wallet) return;
    setEndingId(row.id);
    try {
      const res = await fetch(`/api/streams/${row.id}/end`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorModal({ open: true, message: json.error || "Could not end stream." });
        return;
      }
      if (json.message) setInfoModal({ open: true, message: json.message });
      await loadStreams();
    } catch {
      setErrorModal({ open: true, message: "Network error." });
    } finally {
      setEndingId(null);
    }
  }

  async function removeStream(row) {
    if (!row?.id) return;
    if (!wallet) {
      setErrorModal({ open: true, message: "Connect the same wallet you used to add this stream." });
      return;
    }
    try {
      const res = await fetch(`/api/streams/${row.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorModal({ open: true, message: json.error || "Could not remove stream." });
        return;
      }
      await loadStreams();
    } catch {
      setErrorModal({ open: true, message: "Network error while removing stream." });
    }
  }

  function getSrcFor(playbackId) {
    const trimmed = playbackId.trim();
    const isUrl = /^https?:\/\//i.test(trimmed);
    const src = isUrl ? trimmed : `https://livepeercdn.com/hls/${trimmed}/index.m3u8`;
    return [{ src, type: "application/x-mpegURL" }];
  }

  useEffect(() => {
    let timer;
    async function fetchAll() {
      await Promise.all(
        streams.map(async ({ playbackId }) => {
          try {
            if (/^https?:\/\//i.test(playbackId)) return;
            const res = await fetch(`/api/livepeer/metrics?playbackId=${encodeURIComponent(playbackId)}`, {
              cache: "no-store",
            });
            if (!res.ok) return;
            const json = await res.json();
            const d = json?.data || {};
            const summary = {
              viewers: d.viewers ?? d.currentViewers ?? "—",
              bitrate: d.bitrate ?? d.bitrateKbps ?? "—",
              resolution: d.resolution ?? "—",
              latency: d.latency ?? "—",
            };
            setMetrics((prev) => ({ ...prev, [playbackId]: summary }));
          } catch {
            /* ignore */
          }
        })
      );
    }
    fetchAll();
    timer = setInterval(fetchAll, 60_000);
    return () => clearInterval(timer);
  }, [streams]);

  useEffect(() => {
    async function fetchYt() {
      await Promise.all(
        streams.map(async ({ playbackId }) => {
          if (!/^https?:\/\//i.test(playbackId)) return;
          if (!/(youtube\.com|youtu\.be)\//i.test(playbackId)) return;
          try {
            const url = playbackId.startsWith("http") ? playbackId : `https://${playbackId}`;
            const res = await fetch(`/api/youtube/oembed?url=${encodeURIComponent(url)}`, {
              cache: "no-store",
            });
            if (!res.ok) return;
            const json = await res.json();
            setYtMeta((prev) => ({ ...prev, [playbackId]: json }));
          } catch {
            /* ignore */
          }
        })
      );
    }
    fetchYt();
  }, [streams]);

  async function copyPlayback(playbackId, rowId) {
    try {
      await navigator.clipboard.writeText(playbackId);
      const marker = rowId || playbackId;
      setCopiedId(marker);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setErrorModal({ open: true, message: "Could not copy to clipboard." });
    }
  }

  return (
    <>
      <div className="site-page-top site-page-pad-x min-h-[100dvh] bg-[#070005] pb-[max(4rem,env(safe-area-inset-bottom))] md:min-h-screen md:pb-16">
        <div className="bg-[#070005]/90 border border-purple-500/20 rounded-2xl p-4 md:p-6 shadow-xl backdrop-blur mb-6">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h1 className="text-2xl md:text-3xl font-display font-semibold text-white">Live</h1>
            <button
              type="button"
              onClick={() => setGuideOpen(true)}
              className="px-3 py-2 rounded-md bg-white/5 hover:bg-white/10 text-white/80 text-sm"
            >
              How to Stream
            </button>
          </div>
          {myLiveSession && (
            <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100/90">
              You are live · {myLiveSession.durationMinutes ?? 0} min · tier{" "}
              {myLiveSession.rewardTierPct > 0 ? `${myLiveSession.rewardTierPct}%` : "building (5 min min)"}
              <button
                type="button"
                onClick={() => endLiveSession(myLiveSession)}
                disabled={endingId === myLiveSession.id}
                className="ml-3 px-3 py-1 rounded-md bg-rose-500/20 border border-rose-500/40 text-rose-100 text-xs hover:bg-rose-500/30 disabled:opacity-50"
              >
                {endingId === myLiveSession.id ? "Ending…" : "End stream"}
              </button>
            </div>
          )}

          <p className="text-xs text-white/45 mb-3">
            Earn 0.1% / 0.2% / 0.3% of platform revenue for streams of 5 / 15 / 30+ minutes. Payouts unlock after a
            14-day lock when you end your session. One live session at a time.
          </p>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col md:flex-row gap-3 items-start md:items-end">
              <div className="flex-1 w-full">
                <label className="block text-xs uppercase tracking-wide text-white/60 mb-1">
                  Stream link (Playback ID, HLS, or YouTube URL)
                </label>
                <input
                  value={newPlaybackId}
                  onChange={(e) => setNewPlaybackId(e.target.value)}
                  disabled={!connected || adding || !!myLiveSession}
                  placeholder={
                    connected
                      ? "https://youtube.com/watch?v=… or Livepeer playback ID"
                      : `Connect ${play.chainLabel} wallet in the header…`
                  }
                  className="w-full px-3 py-2 rounded-md bg-[#1a001a] border border-purple-500/30 text-white placeholder-white/30 focus:outline-none focus:border-purple-400 disabled:opacity-50"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowStreamerForm((v) => !v)}
                disabled={!connected || !!myLiveSession}
                className="px-4 py-2.5 rounded-md border border-white/15 text-white/80 text-sm hover:bg-white/5 disabled:opacity-50"
              >
                {showStreamerForm ? "Hide details" : "Streamer details"}
              </button>
              <button
                type="button"
                onClick={addStream}
                disabled={!connected || adding || !!myLiveSession}
                className="px-5 py-2.5 rounded-md bg-gradient-to-r from-red-magic to-blue-magic text-white font-medium hover:opacity-90 transition disabled:opacity-50"
              >
                {adding ? "Going live…" : "Go live"}
              </button>
            </div>

            {showStreamerForm && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-xl border border-purple-500/20 bg-white/5">
                <div>
                  <label className="block text-xs text-white/50 mb-1">Thumbnail (shown on Live page)</label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={onThumbnailPick}
                    disabled={!connected || adding}
                    className="w-full text-xs text-white/70 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-purple-500/30 file:text-white"
                  />
                  <ThumbnailPreview file={thumbnailFile} />
                </div>
                <div className="space-y-2">
                  <input
                    value={xHandle}
                    onChange={(e) => setXHandle(e.target.value)}
                    placeholder="X handle (optional)"
                    className="w-full px-3 py-2 rounded-md bg-[#1a001a] border border-purple-500/20 text-white text-sm placeholder-white/30"
                  />
                  <input
                    value={telegramUsername}
                    onChange={(e) => setTelegramUsername(e.target.value)}
                    placeholder="Telegram username (optional)"
                    className="w-full px-3 py-2 rounded-md bg-[#1a001a] border border-purple-500/20 text-white text-sm placeholder-white/30"
                  />
                  <input
                    value={solanaPayoutWallet}
                    onChange={(e) => setSolanaPayoutWallet(e.target.value)}
                    placeholder="Solana wallet for rewards (optional)"
                    className="w-full px-3 py-2 rounded-md bg-[#1a001a] border border-purple-500/20 text-white text-sm placeholder-white/30 font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {!connected && (
            <p className="mt-2 text-xs text-white/50">
              Connect on <span className="text-white/70">{play.chainLabel}</span> in the header, then go live.
            </p>
          )}
          {connected && wallet && (
            <p className="mt-2 text-xs text-white/50">
              Wallet <span className="font-mono text-white/70">{play.address?.slice(0, 4)}…{play.address?.slice(-4)}</span> ·{" "}
              {play.chainLabel}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-6">
          {streams.length === 0 && listSource === "loading" && (
            <div className="col-span-full flex flex-col items-center justify-center gap-3 py-16 text-white/60">
              <div
                className="h-10 w-10 rounded-full border-2 border-purple-400/30 border-t-purple-400 animate-spin"
                role="status"
                aria-label="Loading streams"
              />
              <p className="text-sm">Loading streams…</p>
            </div>
          )}
          {streams.length === 0 && listSource !== "loading" && (
            <div className="col-span-full rounded-xl border border-purple-500/20 bg-white/5 p-8 text-center">
              <p className="text-white font-medium mb-2">No live streams yet</p>
              <p className="text-white/55 text-sm max-w-md mx-auto">
                Be the first — connect your wallet, go live with Livepeer or YouTube, and add your playback ID or URL above.
              </p>
            </div>
          )}

          {streams.map((stream, idx) => {
            const { id, playbackId, wallet: ownerWallet } = stream;
            const isOwner = id && ownerWallet && wallet && walletsMatch(ownerWallet, wallet, play.chain);
            const watchUrl = streamWatchUrl(playbackId);
            return (
              <StreamCard
                key={id || `${playbackId}-${idx}`}
                stream={stream}
                idx={idx}
                metrics={metrics}
                ytMeta={ytMeta}
                isOwner={isOwner}
                copiedId={copiedId}
                endingId={endingId}
                watchUrl={watchUrl}
                getSrcFor={getSrcFor}
                onCopy={copyPlayback}
                onRemove={removeStream}
                onEnd={endLiveSession}
                onCardOpen={() => window.open(watchUrl, "_blank", "noopener,noreferrer")}
              />
            );
          })}
        </div>
      </div>

      {errorModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setErrorModal({ open: false, message: "" })}
            role="presentation"
          />
          <div className="relative bg-[#0e0010] border border-red-500/30 rounded-2xl p-5 w-[90%] max-w-md shadow-2xl">
            <h3 className="text-white text-lg font-semibold mb-2">Stream Error</h3>
            <p className="text-white/80 text-sm mb-4">{errorModal.message}</p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="px-4 py-2 rounded-md bg-white/10 text-white hover:bg-white/15"
                onClick={() => setErrorModal({ open: false, message: "" })}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {infoModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setInfoModal({ open: false, message: "" })}
            role="presentation"
          />
          <div className="relative bg-[#0e0010] border border-emerald-500/30 rounded-2xl p-5 w-[90%] max-w-md shadow-2xl">
            <h3 className="text-white text-lg font-semibold mb-2">Stream submitted</h3>
            <p className="text-white/80 text-sm mb-4">{infoModal.message}</p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="px-4 py-2 rounded-md bg-white/10 text-white hover:bg-white/15"
                onClick={() => setInfoModal({ open: false, message: "" })}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {guideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => setGuideOpen(false)} role="presentation" />
          <div className="relative w-[96%] max-w-3xl rounded-2xl overflow-hidden shadow-2xl border border-purple-500/30">
            <div className="bg-gradient-to-r from-red-magic/70 to-blue-magic/70 p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-white text-xl md:text-2xl font-display font-semibold">How to Stream</h3>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-md bg-white/15 hover:bg-white/25 text-white/90 text-sm"
                  onClick={() => setGuideOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
            <div className="bg-[#0e0010] text-white/90 p-6 md:p-7 max-h-[80vh] overflow-y-auto">
              <p className="text-sm text-white/75 mb-4 leading-relaxed">
                Stream your casino play on APT-Casino and earn a share of platform revenue. Connect your wallet, go live
                on YouTube or Livepeer, add a thumbnail and socials, then tap{' '}
                <span className="text-white font-medium">Go live</span>. Viewers click your card to open the stream in a
                new tab.
              </p>

              <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 mb-5 text-sm">
                <p className="text-amber-100/95 font-medium mb-1">Streamer rewards (per session)</p>
                <ul className="text-white/75 text-xs space-y-1">
                  <li>5+ minutes live → <strong className="text-white">0.1%</strong> of platform revenue</li>
                  <li>15+ minutes → <strong className="text-white">0.2%</strong></li>
                  <li>30+ minutes → <strong className="text-white">0.3%</strong></li>
                </ul>
                <p className="text-white/45 text-xs mt-2">
                  Keep this page open while streaming (or use End stream when done). One live session at a time. Payouts
                  unlock <strong className="text-white/70">14 days</strong> after you end the session, then are reviewed
                  and sent to your Solana payout wallet (if set).
                </p>
              </div>

              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 text-xs text-white/65">
                <li className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5">
                  <span className="text-white/90 font-medium block mb-0.5">1. Connect wallet</span>
                  Solana or Aptos from the header.
                </li>
                <li className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5">
                  <span className="text-white/90 font-medium block mb-0.5">2. Streamer details</span>
                  Thumbnail, X, Telegram, optional Solana payout wallet.
                </li>
                <li className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5">
                  <span className="text-white/90 font-medium block mb-0.5">3. Paste stream link</span>
                  YouTube live URL, Livepeer Playback ID, or HLS URL.
                </li>
                <li className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5">
                  <span className="text-white/90 font-medium block mb-0.5">4. Go live</span>
                  Tap End stream when finished to lock your duration tier.
                </li>
              </ul>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    <h4 className="text-white font-medium">Livepeer (OBS)</h4>
                  </div>
                  <ol className="list-decimal list-inside space-y-2.5 text-white/80 text-sm leading-relaxed">
                    <li>
                      Create a stream in{' '}
                      <a
                        href="https://livepeer.studio/dashboard"
                        className="text-emerald-300/90 underline hover:text-emerald-200"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Livepeer Studio
                      </a>
                      .
                    </li>
                    <li>In OBS, set Server to the ingest URL and Stream Key from Livepeer.</li>
                    <li>Start streaming, then copy your <span className="text-white">Playback ID</span>.</li>
                    <li>
                      Paste the Playback ID on the Live page and click{' '}
                      <span className="text-white font-medium">Go live</span>.
                    </li>
                  </ol>
                </div>
                <div className="rounded-xl border border-rose-500/25 bg-rose-500/5 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex h-2.5 w-2.5 rounded-full bg-rose-400" />
                    <h4 className="text-white font-medium">YouTube Live</h4>
                  </div>
                  <ol className="list-decimal list-inside space-y-2.5 text-white/80 text-sm leading-relaxed">
                    <li>
                      Start a live broadcast from{' '}
                      <a
                        href="https://studio.youtube.com/"
                        className="text-rose-300/90 underline hover:text-rose-200"
                        target="_blank"
                        rel="noreferrer"
                      >
                        YouTube Studio
                      </a>
                      .
                    </li>
                    <li>Copy your public watch or share link while the stream is live.</li>
                    <li>
                      Paste the live watch/share URL and click{' '}
                      <span className="text-white font-medium">Go live</span>.
                    </li>
                  </ol>
                  <p className="mt-3 text-xs text-white/50">
                    Examples: youtube.com/live/… · youtube.com/watch?v=… · youtu.be/…
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
