import { describe, it, expect } from "vitest";
import { isNetlifyHost } from "./indexability";

describe("isNetlifyHost", () => {
  it("matches the site's own Netlify host and its deploy previews", () => {
    expect(isNetlifyHost("29-navy.netlify.app")).toBe(true);
    expect(isNetlifyHost("deploy-preview-42--29-navy.netlify.app")).toBe(true);
    expect(isNetlifyHost("branch--29-navy.netlify.app")).toBe(true);
    expect(isNetlifyHost("netlify.app")).toBe(true);
  });

  it("is case-insensitive, as hostnames are", () => {
    expect(isNetlifyHost("29-Navy.Netlify.App")).toBe(true);
  });

  // The whole point of the rule: it must never be able to delist the launched
  // site, on any of the hosts the client's domain is reachable at.
  it("never matches the client's domain", () => {
    expect(isNetlifyHost("29navy.com")).toBe(false);
    expect(isNetlifyHost("www.29navy.com")).toBe(false);
  });

  it("does not match a host that merely contains the string", () => {
    expect(isNetlifyHost("netlify.app.example.com")).toBe(false);
    expect(isNetlifyHost("notnetlify.app")).toBe(false);
    expect(isNetlifyHost("my-netlify.app.co")).toBe(false);
  });

  it("leaves local development alone", () => {
    expect(isNetlifyHost("localhost")).toBe(false);
    expect(isNetlifyHost("sveltekit-prerender")).toBe(false);
  });
});
