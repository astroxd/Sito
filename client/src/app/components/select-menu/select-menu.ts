import { Component, input, model, signal } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
@Component({
  selector: 'app-select-menu',
  imports: [FontAwesomeModule],
  templateUrl: './select-menu.html',
  styleUrl: './select-menu.css',
})
export class SelectMenu {
  readonly menuTitle = input.required<string>();
  readonly options = input.required<any[]>();
  readonly multiple = input<boolean>(false);

  selectedOptions = model<any[]>([]);
  showMenu = signal<boolean>(false);

  faChevronDown = faChevronDown;

  protected addToSelection = (object: any) => {
    console.log('ADDDDD');
    if (!this.multiple()) {
      this.showMenu.set(false);
    }
    let filteredResult;

    if (this.multiple()) {
      if ((this.selectedOptions() as any[]).some((option) => option.name === object.name)) {
        this.removeFromSelection(object);
      } else {
        filteredResult = [...(this.selectedOptions() as any[]), object];
        this.selectedOptions.set(filteredResult);
      }
    } else {
      //* if in single selection the clicked element is the same as before prevent update
      if (object.name === (this.selectedOptions()[0] as any)?.name) {
        this.removeFromSelection(object);
        return;
      }

      filteredResult = object;
      this.selectedOptions.set([filteredResult]);
    }
  };

  protected removeFromSelection = (object: any) => {
    // if (object === undefined) return;

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
