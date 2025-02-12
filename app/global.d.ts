declare namespace google {
    namespace accounts {
      namespace id {
        function initialize(options: { client_id: string; callback: (response: any) => void }): void;
        function renderButton(element: HTMLElement | null, options: { theme: string; size: string }): void;
      }
    }
  }