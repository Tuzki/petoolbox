/** Boot the compatibility engine once after Astro has parsed the component. */
const root = document.querySelector<HTMLElement>("[data-llc-designer-root]");

if (root && root.dataset.llcBooted !== "true") {
  root.dataset.llcBooted = "true";
  void import("./legacy-v5-engine");
}
