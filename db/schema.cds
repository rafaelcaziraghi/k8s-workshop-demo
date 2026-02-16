namespace workshop;

using { cuid, managed } from '@sap/cds/common';

/**
 * Workshop Notes — a simple entity to demonstrate
 * CAP CRUD operations with OData and OpenUI5.
 */
entity Notes : cuid, managed {
  title    : String(100)  @mandatory;
  content  : String(1000);
  category : String(50);
  priority : Integer default 3;
}

/**
 * Participants — tracks who deployed in the workshop.
 * Each person adds themselves after a successful deploy.
 */
entity Participants : cuid, managed {
  name     : String(100)  @mandatory;
  hostname : String(100);
  deployed : Boolean default true;
}
