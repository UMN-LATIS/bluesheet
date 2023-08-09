interface RequestOptions {
  headers?: {
      [key: string]: string;
  };
  [key: string]: unknown; // This allows for additional properties if needed
}

export const apiRequest = (method, url, options: RequestOptions = {}) => {
  return cy.request({
      method,
      url,
      headers: {
          'Accept': 'application/json',
          ...options.headers
      },
      ...options
  });
};
