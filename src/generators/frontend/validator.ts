import { APIEndpointDefinition, AppRequirement, UIComponentDefinition } from '../../types/app';

const VALID_COMPONENT_NAME = /^[A-Z][A-Za-z0-9]*$/;

export class FrontendValidator {
  async validateRequirements(requirement: AppRequirement): Promise<boolean> {
    await Promise.resolve();

    if (!requirement.name || requirement.name.trim() === '') return false;
    if (!requirement.description || requirement.description.trim() === '') return false;

    const componentsValid = this.validateComponentNames(requirement.uiComponents ?? []);
    const endpointsValid = this.validateAPIEndpoints(requirement.apiEndpoints ?? []);

    return componentsValid && endpointsValid;
  }

  validateComponentNames(components: UIComponentDefinition[]): boolean {
    const names = components.map((c) => c.name);
    const uniqueNames = new Set(names);

    if (uniqueNames.size !== names.length) return false;

    for (const component of components) {
      if (!VALID_COMPONENT_NAME.test(component.name)) return false;

      if (!component.relatedEndpoints || component.relatedEndpoints.length === 0) {
        if (component.type !== 'dashboard' && component.type !== 'page') {
          return false;
        }
      }

      const validTypes: UIComponentDefinition['type'][] = [
        'page',
        'form',
        'list',
        'detail',
        'dashboard',
      ];
      if (!validTypes.includes(component.type)) return false;
    }

    return true;
  }

  validateAPIEndpoints(endpoints: APIEndpointDefinition[]): boolean {
    const seen = new Set<string>();

    for (const endpoint of endpoints) {
      if (!endpoint.path || !endpoint.path.startsWith('/')) return false;
      if (!endpoint.description || endpoint.description.trim() === '') return false;

      const key = `${endpoint.method} ${endpoint.path}`;
      if (seen.has(key)) return false;
      seen.add(key);

      const methods: APIEndpointDefinition['method'][] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
      if (!methods.includes(endpoint.method)) return false;
    }

    return true;
  }
}
