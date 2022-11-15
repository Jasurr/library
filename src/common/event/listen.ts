type MethodDecoratorFactoryFunction = (
    target: any,
    key: string | number,
    descriptor: PropertyDescriptor
) => void;

export function Listen(
    eventName: string,
    selector?: string
): MethodDecoratorFactoryFunction {
    return function decorator(
        target: any,
        key: string | number,
        descriptor: PropertyDescriptor
    ) {
        const {
            connectedCallback = () => {
            },
            disconnectedCallback = () => {
            }
        } = target;
        const symbolMethod = Symbol(key);

        function getContext(context: any) {
            const root = context.shadowRoot ? context.shadowRoot : context;
            return selector ? root.querySelector(selector) : context
        }

        function addListener() {
            // @ts-ignore
            const handler = (this[symbolMethod] = (...args) => {
                // @ts-ignore
                descriptor.value.apply(this, args)
            });
            // @ts-ignore
            getContext(this).addEventListener(eventName, handler);
        }

        function removeListener() {
            // @ts-ignore
            getContext(this).removeEventListener(eventName, this[symbolMethod]);
        }

        target.connectedCallback = function connectedCallbackWrapper() {
            connectedCallback.call(this)
        }
        target.disconnectedCallback = function disconnectedCallbackWrapper() {
            disconnectedCallback.call(this)
            removeListener.call(this)
        }
    }
}