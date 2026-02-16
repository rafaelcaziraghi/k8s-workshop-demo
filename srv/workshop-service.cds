using { workshop } from '../db/schema';

/**
 * Workshop OData Service
 * 
 * Exposes Notes and Participants via OData v4.
 * Access at: /odata/v4/workshop/
 * 
 * CAP auto-generates CRUD endpoints:
 *   GET    /odata/v4/workshop/Notes
 *   POST   /odata/v4/workshop/Notes
 *   GET    /odata/v4/workshop/Notes(<id>)
 *   PATCH  /odata/v4/workshop/Notes(<id>)
 *   DELETE /odata/v4/workshop/Notes(<id>)
 * 
 * Same for Participants.
 */
service WorkshopService @(path: '/odata/v4/workshop') {

  entity Notes        as projection on workshop.Notes;
  entity Participants as projection on workshop.Participants;

}
