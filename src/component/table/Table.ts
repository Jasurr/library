import {attachStyle, attachTemplate, Component, Listen, css, html} from '../../common/index';
import {TrComponent} from "./Tr";
import {TdComponent} from "./Td";

export interface Column {
    property: string,
    label: string,
    span?: number,
    align: 'left' | 'center' | 'right' | 'justify',
    index: number
}

export type ColumnData = Column[]

// @ts-ignore
@Component({
    selector: 't-table',
    custom: {extends: 'table'},
    style: css`
      [is='t-table'] {
        font-family: var(--font-default);
        font-size: var(--font-body-md);
        font-weight: var(--font-weight-default);
        color: var(--color-neutral-500);
        width: 100%;
      }

      [is='t-table'] th {
        display: table-cell;
        box-sizing: border-box;
        margin-top: var(--margin-xs);
        padding-left: calc(var(--padding-xxs) + var(--padding-sm));
        padding-right: var(--padding-xxs);
        height: 44px;
        vertical-align: middle;
        font-weight: var(--font-weight-default);
      }

      [is='t-table'] tr {
        height: 58px;
        vertical-align: middle;
      }

      [is='t-table'] td {
        padding-left: var(--padding-xxs);
        padding-right: var(--padding-xxs);
      }

      [is='t-table'] td.delete-cell button {
        transform: translateY(-2px);
      }

      [is='t-table'] td.delete-cell[readonly='true'] {
        display: none;
      }

      [is='t-table'] td:first-child {
        padding-left: var(--padding-lg);
      }

      [is='in-table'] th:first-child {
        padding-left: calc(var(--padding-lg) + var(--padding-sm));
      }

      [is='in-table'] th:last-child,
      [is='in-table'] td:last-child {
        padding-right: var(--padding-lg);
      }
    `,
    template: `
      <thead></thead>
      <tbody></tbody>
    `,
})
export class TableComponent extends HTMLTableElement {
    private channel: BroadcastChannel;
    private columnData: ColumnData;
    private savedState: any[];
    private editIndex: number = 0;
    private blankRowData: any;

    constructor() {
        super();
        attachTemplate(this);
        attachStyle(this);
    }

    attributeChangedCallback(name: string, prev: any, next: any) {
        switch (name) {
            case 'channel':
                this.channel = new BroadcastChannel(next);
                this.channel.onmessage = this.onMessage.bind(this);
                break;
        }
    }

    onMessage(ev: any) {
        switch (ev.data.type) {
            case 'add':
                this.onAdd();
                break;
            case 'data':
                this.onTableData(ev.data.detail);
                break;
            case 'edit':
                this.onEdit();
                break;
            case 'readOnly':
                this.onReadOnly();
                break;
            case 'save':
                this.onSave();
                break;
        }
    }

    onAdd() {
        if (!this.savedState) {
            this.savedState = JSON.parse(JSON.stringify(this.state));
        }
        const rowData = this.blankRowData;

        const tr = document.createElement('tr', {is: 'in-tr'});
        this.columnData.forEach((colData) => {
            const td = document.createElement('td', {is: 'in-td'});
            if (colData.align) {
                td.align = colData.align;
            }
            td.setAttribute('data-property', colData.property);
            td.setAttribute('readonly', 'false');
            td.setAttribute('value', rowData[colData.property]);
            tr.appendChild(td);
        });

        this.createDeleteButton(tr);

        this.$body.appendChild(tr);

        tr.dispatchEvent(
            new CustomEvent('data', {
                detail: rowData,
            })
        );

        const cells = this.querySelectorAll('td');

        cells.forEach(this.handleCellListeners.bind(this));

        this.editIndex = Array.from(cells).indexOf(
            tr.children[0] as HTMLTableDataCellElement
        );

        this.onNext();
    }
    onEdit() {
        const cells = this.querySelectorAll('td');
        if (!this.savedState) {
            this.savedState = JSON.parse(JSON.stringify(this.state));
        }
        cells.forEach(this.handleCellListeners.bind(this));
        this.onNext();
    }
    onReadOnly() {
        const cells = this.querySelectorAll('td');
        cells.forEach((td) => {
            td.setAttribute('readonly', 'true');
        });
        if (this.savedState) {
            this.renderRows(this.savedState);
            this.savedState = undefined;
        }
        this.editIndex = 0;
    }
    onSave() {
        const data: TrComponent[] = this.state;

        if (this.querySelectorAll('td')[this.editIndex]) {
            this.querySelectorAll('td')[this.editIndex].setAttribute(
                'readonly',
                'true'
            );
        }

        this.savedState = undefined;
        this.editIndex = 0;

        const validRows = this.validateRows(data);

        this.channel.postMessage({
            type: 'change',
            detail: validRows,
        });

        this.renderRows(validRows);
    }
    onTableData(next) {
        this.renderHeader(next.columnData);
        this.renderRows(next.rowData);
    }

    handleCellListeners(td: TdComponent, index: number) {
        const tr = td.parentNode as TrComponent;
        const input = td.querySelector('in-textinput') as HTMLInputElement;
        const button = td.querySelector('[is="in-button"]') as HTMLButtonElement;
        if (input) {
            input.value = td.getAttribute('value');
            td.setAttribute('readonly', 'false');

            input.onclick = (ev) => {
                const cells = this.querySelectorAll('td');
                this.editIndex = Array.from(cells).indexOf(td);
            };

            input.onkeyup = (ev) => {
                td.setAttribute('value', input.value);
                tr.dispatchEvent(
                    new CustomEvent('patch', {
                        detail: {
                            property: td.getAttribute('data-property'),
                            changes: td.getAttribute('value'),
                        },
                    })
                );
            };

            input.onkeydown = (ev) => {
                ev.stopPropagation();
                if (ev.key === 'Tab') {
                    this.editIndex = index;
                    this.onNext();
                }
            };
        }
        if (button) {
            td.setAttribute('readonly', 'false');
            button.onclick = () => {
                this.editIndex = index;
                td.parentNode.dispatchEvent(new CustomEvent('delete'));
            };
            button.onkeydown = (ev) => {
                ev.stopPropagation();
                if (ev.key === 'Tab') {
                    this.editIndex = index;
                    this.onNext();
                }
                if (ev.key === 'Enter' || ev.key === 'Select') {
                    this.editIndex = index;
                    this.onNext();
                    td.parentNode.dispatchEvent(new CustomEvent('delete'));
                }
            };
        }
    }


}