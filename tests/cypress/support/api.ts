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

export const put = (url: string, body: object, options: RequestOptions = {}) =>
  cy.csrfToken().then((token) =>
    cy.request({
      method: "PUT",
      url,
      body,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-CSRF-Token": token,
        ...options.headers,
      },
      ...options,
    }),
  );

// `delete` is a reserved word
export const destroy = (url: string, options: RequestOptions = {}) =>
  cy.csrfToken().then((token) =>
    cy.request({
      method: "DELETE",
      url,
      headers: {
        Accept: "application/json",
        "X-CSRF-Token": token,
        ...options.headers,
      },
      ...options,
    }),
  );

export default {
  get,
  post,
  put,
  delete: destroy,
};
