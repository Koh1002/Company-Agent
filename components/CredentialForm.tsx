"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, KeyRound, Cloud, LogOut } from "lucide-react";
import {
  clearCredentials,
  loadCredentials,
  saveCredentials,
} from "@/lib/credentials";
import type { Credentials, ProviderMode } from "@/lib/types";

const AWS_REGIONS = [
  "us-east-1",
  "us-west-2",
  "ap-northeast-1",
  "ap-northeast-3",
  "ap-southeast-1",
  "eu-central-1",
  "eu-west-1",
];

export function CredentialForm({
  onSaved,
}: {
  onSaved?: (creds: Credentials) => void;
}) {
  const [mode, setMode] = useState<ProviderMode>("anthropic");
  const [apiKey, setApiKey] = useState("");
  const [accessKeyId, setAccessKeyId] = useState("");
  const [secretAccessKey, setSecretAccessKey] = useState("");
  const [sessionToken, setSessionToken] = useState("");
  const [region, setRegion] = useState("us-east-1");
  const [showSecrets, setShowSecrets] = useState(false);
  const [savedMode, setSavedMode] = useState<ProviderMode | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const c = loadCredentials();
    if (!c) return;
    setSavedMode(c.mode);
    setMode(c.mode);
    if (c.mode === "anthropic") {
      setApiKey(c.apiKey);
    } else {
      setAccessKeyId(c.accessKeyId);
      setSecretAccessKey(c.secretAccessKey);
      setSessionToken(c.sessionToken ?? "");
      setRegion(c.region);
    }
  }, []);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    let creds: Credentials;
    if (mode === "anthropic") {
      if (!apiKey.trim()) {
        setError("Anthropic API キーを入力してください");
        return;
      }
      creds = { mode: "anthropic", apiKey: apiKey.trim() };
    } else {
      if (!accessKeyId.trim() || !secretAccessKey.trim() || !region.trim()) {
        setError("Access Key ID / Secret Access Key / Region は必須です");
        return;
      }
      creds = {
        mode: "bedrock",
        accessKeyId: accessKeyId.trim(),
        secretAccessKey: secretAccessKey.trim(),
        sessionToken: sessionToken.trim() || undefined,
        region: region.trim(),
      };
    }
    saveCredentials(creds);
    setSavedMode(creds.mode);
    onSaved?.(creds);
  }

  function onSignOut() {
    clearCredentials();
    setSavedMode(null);
    setApiKey("");
    setAccessKeyId("");
    setSecretAccessKey("");
    setSessionToken("");
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] p-4 shadow-xl sm:p-6"
    >
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setMode("anthropic")}
          className={`flex h-11 flex-1 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium transition ${
            mode === "anthropic"
              ? "bg-[var(--color-accent)] text-white"
              : "bg-[var(--color-panel-2)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
          }`}
        >
          <KeyRound size={16} />
          Anthropic API
        </button>
        <button
          type="button"
          onClick={() => setMode("bedrock")}
          className={`flex h-11 flex-1 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium transition ${
            mode === "bedrock"
              ? "bg-[var(--color-accent)] text-white"
              : "bg-[var(--color-panel-2)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
          }`}
        >
          <Cloud size={16} />
          AWS Bedrock
        </button>
      </div>

      <div className="space-y-3">
        {mode === "anthropic" ? (
          <Field label="Anthropic API Key">
            <SecretInput
              value={apiKey}
              onChange={setApiKey}
              placeholder="sk-ant-..."
              show={showSecrets}
              onToggleShow={() => setShowSecrets((v) => !v)}
            />
          </Field>
        ) : (
          <>
            <Field label="AWS Access Key ID">
              <input
                value={accessKeyId}
                onChange={(e) => setAccessKeyId(e.target.value)}
                placeholder="AKIA..."
                className={inputCls}
                autoComplete="off"
              />
            </Field>
            <Field label="AWS Secret Access Key">
              <SecretInput
                value={secretAccessKey}
                onChange={setSecretAccessKey}
                placeholder="..."
                show={showSecrets}
                onToggleShow={() => setShowSecrets((v) => !v)}
              />
            </Field>
            <Field label="AWS Session Token (一時資格情報の場合のみ)">
              <SecretInput
                value={sessionToken}
                onChange={setSessionToken}
                placeholder="(任意)"
                show={showSecrets}
                onToggleShow={() => setShowSecrets((v) => !v)}
              />
            </Field>
            <Field label="Region">
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className={inputCls}
              >
                {AWS_REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </Field>
          </>
        )}
      </div>

      {error && (
        <p className="mt-3 rounded-md bg-red-900/40 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      )}

      <div className="mt-5 flex items-center gap-2">
        <button
          type="submit"
          className="h-11 flex-1 rounded-lg bg-[var(--color-accent)] px-4 text-sm font-semibold text-white transition hover:opacity-90"
        >
          {savedMode ? "更新して保存" : "保存して開始"}
        </button>
        {savedMode && (
          <button
            type="button"
            onClick={onSignOut}
            className="flex h-11 items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 text-sm text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">サインアウト</span>
          </button>
        )}
      </div>

      <p className="mt-4 text-xs leading-relaxed text-[var(--color-fg-muted)]">
        資格情報はこのブラウザの localStorage のみに保存されます (サーバ側には永続化されません)。
        共有端末では使用しないでください。
      </p>
    </form>
  );
}

const inputCls =
  "w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-panel-2)] px-3 py-2.5 text-[var(--color-fg)] outline-none focus:border-[var(--color-accent)]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-[var(--color-fg-muted)]">
        {label}
      </span>
      {children}
    </label>
  );
}

function SecretInput({
  value,
  onChange,
  placeholder,
  show,
  onToggleShow,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  show: boolean;
  onToggleShow: () => void;
}) {
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${inputCls} pr-10`}
        autoComplete="off"
      />
      <button
        type="button"
        onClick={onToggleShow}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}
