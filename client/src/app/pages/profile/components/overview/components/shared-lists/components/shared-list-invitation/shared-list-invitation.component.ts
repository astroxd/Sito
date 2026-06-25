import { Component, inject, input, OnInit, output } from '@angular/core';
import { finalize } from 'rxjs';
import { SharedListInvitation } from 'src/app/models/SharedList';
import { SharedListsService } from 'src/app/services/shared-lists-service';
import { IonButton } from '@ionic/angular/standalone';

@Component({
  selector: 'app-shared-list-invitation',
  templateUrl: './shared-list-invitation.component.html',
  styleUrls: ['./shared-list-invitation.component.scss'],
  imports: [IonButton],
})
export class SharedListInvitationComponent implements OnInit {
  invitation = input.required<SharedListInvitation>();
  sharedListService = inject(SharedListsService);

  onAction = output();

  constructor() {}

  ngOnInit() {}

  accept() {
    this.sharedListService
      .acceptInvite(this.invitation().sharedList.sharedListId)
      .pipe(
        finalize(() => {
          this.onAction.emit();
        }),
      )
      .subscribe();
  }

  decline() {
    this.sharedListService
      .declineInvite(this.invitation().sharedList.sharedListId)
      .pipe(
        finalize(() => {
          this.onAction.emit();
        }),
      )
      .subscribe();
  }
}
