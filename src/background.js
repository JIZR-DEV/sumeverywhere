"use strict";
// background.js — service worker (Chrome) / scripts (Firefox)
// v0.1: solo abre welcome.html en instalacion nueva.
// v1.0 reservado: runtime.onMessage para ENGINE_STATE e INCREMENT_COUNTER.

browser.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    browser.tabs.create({ url: browser.runtime.getURL("welcome.html") });
  }
});

// Canal reservado para v1.0
browser.runtime.onMessage.addListener((_msg, _sender, _sendResponse) => {
  // {type:'ENGINE_STATE'} -> browser.action.setIcon(...)
  // {type:'INCREMENT_COUNTER', engine} -> actualizar storage.local
  return false; // no bloquea el canal
});
