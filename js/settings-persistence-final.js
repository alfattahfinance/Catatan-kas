// Final settings persistence guard.
// Local saved settings are authoritative over stale cloud settings.
(() => {
  const SETTINGS_KEY = "pengaturanAplikasi";
  const LOGO_KEY = "logoDashboard";
  const TYPES_KEY = "jenisKeuanganCustom";
  const PENDING_KEY = "pengaturanAplikasiPending";
  const MARKER_KEY = "pengaturanAplikasiLastSavedAt";

  const read = (key, fallback = null) => {
    try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); }
    catch (_) { return fallback; }
  };
  const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {} };
  const snapshot = () => ({
    settings: read(SETTINGS_KEY, {}),
    logo: localStorage.getItem(LOGO_KEY) || "",
    types: read(TYPES_KEY, [])
  });

  window.CatatanKasSettingsPersistence = {
    markSaved() {
      const savedAt = Date.now();
      write(PENDING_KEY, { data: snapshot(), savedAt });
      localStorage.setItem(MARKER_KEY, String(savedAt));
    },
    getSnapshot: snapshot,
    restoreIfPending() {
      const pending = read(PENDING_KEY, null);
      if (!pending?.data) return false;
      const current = snapshot();
      if (JSON.stringify(current) === JSON.stringify(pending.data)) return false;
      write(SETTINGS_KEY, pending.data.settings || {});
      if (pending.data.logo) localStorage.setItem(LOGO_KEY, pending.data.logo);
      if (Array.isArray(pending.data.types)) write(TYPES_KEY, pending.data.types);
      window.dispatchEvent(new CustomEvent("settingsChanged", { detail: { restored: true, ...pending.data.settings } }));
      return true;
    }
  };

  window.addEventListener("settingsChanged", () => window.CatatanKasSettingsPersistence.markSaved());
  window.addEventListener("jenisKeuanganBerubah", () => window.CatatanKasSettingsPersistence.markSaved());
  document.addEventListener("DOMContentLoaded", () => window.CatatanKasSettingsPersistence.restoreIfPending());
})();
