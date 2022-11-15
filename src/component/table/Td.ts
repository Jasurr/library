import {attachStyle, attachTemplate, Component, Listen, css, html} from '../../common/index';

//@ts-ignore
@Component({
    selector: 't-td',
    custom: {extends: 'td'},
    style: css`.td-readonly {
      display: table-cell;
      box-sizing: border-box;
      margin-top: var(--margin-xs);
      padding-left: var(--padding-sm);
      height: 44px;
      vertical-align: middle;
    }
      .td-readonly[hidden='true'] {
        display: none;
      }`,
    template: html`
        <span class="td-readonly"></span>
        <span class="td-input">
        <input type="text"/>
    </span>`
})
export class TdComponent extends HTMLTableCellElement {
    constructor() {
        super();
        attachTemplate(this)
    }

    connectedCallback() {
        attachStyle(this)
    }

    static get observedAttributies() {
        return ['value', 'readonly']
    }

    attributeChangedCallback(name: string, prev: any, next: any) {
        switch (name) {
            case 'value':
                this.setValue(next);
                break;
            case 'readonly':
                this.setMode(next === 'true');
                break;
        }
    }

    setValue(value: string) {
        this.$readOnly.innerText = value;
    }

    setMode(readOnly: boolean) {
        if (readOnly) {
            this.$readOnly.removeAttribute('hidden');
            this.$inputContainer.setAttribute('hidden', 'true');
        } else {
            this.$readOnly.setAttribute('hidden', 'true');
            this.$inputContainer.removeAttribute('hidden');
        }
    }

    get $readOnly(): HTMLSpanElement {
        return this.querySelector('input') as HTMLSpanElement;
    }

    get $inputContainer(): HTMLSpanElement {
        return this.querySelector(".td-input") as HTMLSpanElement;
    }
}