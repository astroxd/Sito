import {
  Directive,
  ElementRef,
  HostListener,
  inject,
  output,
} from '@angular/core';

@Directive({
  selector: '[appClickOutside]',
  standalone: true,
})
export class ClickOutsideDirective {
  private readonly elementRef = inject(ElementRef);

  public readonly appClickOutside = output<void>();

  @HostListener('document:click', ['$event.target'])
  public onClick(targetElement: EventTarget | null): void {
    if (!targetElement || !(targetElement instanceof Node)) return;

    const clickedInside = this.elementRef.nativeElement.contains(targetElement);

    if (!clickedInside) {
      this.appClickOutside.emit();
    }
  }
}
