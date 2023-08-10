interface RequestOptions {
  headers?: {
    [key: string]: string;
  };
  [key: string]: unknown; // This allows for additional properties if needed
}

export const get = (url: string, options: RequestOptions = {}) =>
  cy.request({
    method: "GET",
    url,
    headers: {
      Accept: "application/json",
      ...options.headers,
    },
    ...options,
  });

export const post = (
  url: string,
  body: object,
  options: RequestOptions = {},
) => {
  return cy.csrfToken().then((token) => {
    return cy.request({
      method: "POST",
      url,
      body,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-CSRF-Token": token,
        ...options.headers,
      },
      ...options,
    });
  });
};
