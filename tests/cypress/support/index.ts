// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

/// <reference types="./" />

import "./laravel-commands";
import "./laravel-routes";
import "./assertions";
import "./commands";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to type a few random words into input elements
       * @param count=3
       * @example cy.get('input').typeRandomWords()
       */
      typeRandomWords(
        count?: number,
        options?: Partial<TypeOptions>,
      ): Chainable<JQuery<HTMLElement>>;
    }
  }
}

before(() => {
  cy.artisan("config:clear", {}, { log: false });

  cy.refreshRoutes();
});

after(() => {
  cy.artisan("config:clear", {}, { log: false });
});
