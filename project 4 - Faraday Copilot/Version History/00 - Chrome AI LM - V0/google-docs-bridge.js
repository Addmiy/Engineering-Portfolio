(() => {
  window.SeamlessAIDocsBridge = {
    getLikelyDocumentText() {
      const accessible = document.querySelector('[aria-label="Document content"]');
      if (accessible?.innerText?.trim()) return accessible.innerText.trim();

      const editor = document.querySelector('.kix-appview-editor');
      if (editor?.innerText?.trim()) return editor.innerText.trim();

      return document.body?.innerText?.trim() || '';
    }
  };
})();
