import { eventBus } from "./EventBus.js";
import { PartialFetchOptions, PartialFetchEventPayload } from "./types.js";

export class PartialFetcher {
    /**
     * Loads HTML from a URL and injects it into the target element.
     * Emits lifecycle events: partial:load:start, partial:load:success, partial:load:error, partial:load:complete
     */
    static async load(
        url: string,
        targetSelector: string,
        options: PartialFetchOptions = {}
    ): Promise<void> {
        const { replace = true, signal } = options;

        eventBus.emit("partial:load:start", <PartialFetchEventPayload>{ url, targetSelector });

        try {
            const response = await fetch(url, { signal });
            if (!response.ok) {
                throw new Error(`Fetch failed with status ${response.status}`);
            }

            const html = (await response.text()).trim();
            const container = document.querySelector<HTMLElement>(targetSelector);

            if (!container) {
                throw new Error(`Target container not found: ${targetSelector}`);
            }

            const template = document.createElement("template");
            template.innerHTML = html;

            if (replace) {
                container.replaceChildren(...template.content.childNodes);
            } else {
                container.append(...template.content.childNodes);
            }

            eventBus.emit("partial:load:success", <PartialFetchEventPayload>{
                url,
                targetSelector,
                html,
            });
        } catch (error) {
            eventBus.emit("partial:load:error", <PartialFetchEventPayload>{
                url,
                targetSelector,
                error,
            });
            throw error;
        } finally {
            eventBus.emit("partial:load:complete", <PartialFetchEventPayload>{
                url,
                targetSelector,
            });
        }
    }
}
