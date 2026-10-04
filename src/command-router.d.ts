export type CommandRoute = {
  agent: string;
  approvalRequired: boolean;
};

export function routeCommand(command: string): CommandRoute;
