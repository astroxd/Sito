import { Component, input, model, signal } from '@angular/core';

@Component({
  selector: 'app-select-menu',
  imports: [],
  templateUrl: './select-menu.html',
  styleUrl: './select-menu.scss',
})
export class SelectMenu {
  readonly menuTitle = input.required<string>();
  readonly options = input.required<any[]>();
  readonly multiple = input<boolean>(false);

  selectedOptions = model<any[]>([]);
  showMenu = signal<boolean>(false);

  protected addToSelection = (object: any) => {
    if (!this.multiple()) {
      this.showMenu.set(false);
    }
    let filteredResult;

    if (this.multiple()) {
      if (
        this.selectedOptions().some((option) => option.name === object.name)
      ) {
        this.removeFromSelection(object);
      } else {
        filteredResult = [...this.selectedOptions(), object];
        this.selectedOptions.set(filteredResult);
      }
    } else {
      if (object.name === this.selectedOptions()[0]?.name) {
        this.removeFromSelection(object);
        return;
      }

      filteredResult = object;
      this.selectedOptions.set([filteredResult]);
    }
  };

  protected removeFromSelection = (object: any) => {
    if (!this.multiple()) {
      this.selectedOptions.set([]);
    } else {
      let filteredResult;
      filteredResult = (this.selectedOptions() as any[]).filter(
        (option) => option.name !== object.name,
      );

      this.selectedOptions.set(filteredResult); //* Array
    }
  };
}
