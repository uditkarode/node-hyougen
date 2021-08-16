import { dtObj } from "drytypes";

var params: { [index: string]: unknown[] } = {};

export const getParams = () => params;

export function recordRoute(
  ep: string,
  routeTitle: string,
  devMode = false,
) {
  if (devMode) {
    if (params[routeTitle] == undefined) params[routeTitle] = [];

    params[routeTitle].push(`* **${routeTitle}** ${ep}`);
  }
}

export function recordBodiedRoute<O extends dtObj>(
  ep: string,
  structure: O,
  routeTitle: string,
  devMode = false,
) {
  /* save route for doc */
  if (devMode) {
    if (params[routeTitle] == undefined) params[routeTitle] = [];

    const parameters = Object.entries(structure).reduce((acc, curr) => {
      const [k, v] = curr;
      return `${acc}\n\t- \`${k}\`: ${
        (/DryType<(.+)>/.exec(String(v)) || ["", "unknown"])[1]
      }`;
    }, "");

    params[routeTitle].push(`* **${routeTitle}** ${ep}${parameters}`);
  }
}
