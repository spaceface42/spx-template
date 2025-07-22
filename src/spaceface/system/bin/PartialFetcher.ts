import { eventBus } from "./EventBus";

export class PartialFetcher {
    /**
     * Loads HTML from a URL and injects it into the target element.
     * Emits lifecycle events: partial:load:start, partial:load:success, partial:load:error, partial:load:complete
     * @param url - The URL of the partial HTML.
     * @param targetSelector - The selector for the container to inject into.
     */
    static async load(url: string, targetSelector: string): Promise<void> {
        eventBus.emit("partial:load:start", { url, targetSelector });

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Fetch failed with status ${response.status}`);
            }

            const html = (await response.text()).trim();
            const container =
                document.querySelector<HTMLElement>(targetSelector);

            if (!container) {
                throw new Error(
                    `Target container not found: ${targetSelector}`
                );
            }

            const template = document.createElement("template");
            template.innerHTML = html;

            container.replaceChildren(
                ...Array.from(template.content.childNodes)
            );

            eventBus.emit("partial:load:success", {
                url,
                targetSelector,
                html,
            });
        } catch (error) {
            eventBus.emit("partial:load:error", { url, targetSelector, error });
        } finally {
            eventBus.emit("partial:load:complete", { url, targetSelector });
        }
    }
}
