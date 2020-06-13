import React, { FunctionComponent } from 'react';
import { Provider } from 'react-redux';
import {
  createContainer,
  ViewModule,
  createStore,
  ServiceIdentifiersMap,
  Module,
} from 'reactant-module';
import { Config, App } from './interfaces';

/**
 * **Description:**
 *
 * You can create an app with `createApp()` passing app configuration,
 * which will return an object including `instance`, `store`,
 * and `bootstrap()` method(You can run `bootstrap` to start the app inject into the browser or mobile).
 *
 * **Example:**
 *
 * ```ts
 * @injectable()
 * class Foo {}
 *
 * const app = createApp({
 *   modules: [],
 *   main: Foo,
 *   render: () => {},
 * });
 *
 * expect(app.instance instanceof Foo).toBeTruthy();
 * ```
 */
function createApp<T>({
  /**
   * As the main start-up module.
   */
  main,
  /**
   * As a rendering function for any React renderer.
   */
  render,
  /**
   * Importing the injected dependency modules.
   */
  modules = [],
  /**
   * Dependent injection container options.
   */
  containerOptions,
  /**
   * Preloaded state of shared state for Redux.
   */
  preloadedState,
  /**
   * Reactant's development setting options.
   */
  devOptions,
}: Config<T>): App<T> {
  const ServiceIdentifiers: ServiceIdentifiersMap = new Map();
  const container = createContainer({
    ServiceIdentifiers,
    modules: [main as Module<any>, ...modules],
    options: {
      defaultScope: 'Singleton',
      ...containerOptions,
      skipBaseClassChecks: true,
    },
  });
  const instance = container.get<T>(main);
  const providers: FunctionComponent[] = [];
  const store = createStore(
    modules,
    container,
    ServiceIdentifiers,
    preloadedState,
    providers,
    devOptions
  );
  const withoutReducers = store.getState() === null;
  return {
    instance,
    store: withoutReducers ? null : store,
    bootstrap(...args: any[]): Element | void {
      if (!(instance instanceof ViewModule)) {
        throw new Error(`Main module should be a 'ViewModule'.`);
      }
      const InstanceElement = <instance.component />;
      const RootElement = providers
        .reverse()
        .reduce(
          (WrappedComponent, ProviderComponent) => (
            <ProviderComponent>{WrappedComponent}</ProviderComponent>
          ),
          InstanceElement
        );
      const element = withoutReducers ? (
        RootElement
      ) : (
        <Provider store={store}>{RootElement}</Provider>
      );
      return render(element, ...args);
    },
  };
}

export { createApp };
