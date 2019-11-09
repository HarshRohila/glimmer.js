import { RenderComponentArgs, CustomJitRuntime, renderJitMain, renderJitComponent, getDynamicVar } from '@glimmer/runtime';
import { templateFactory, JitContext, unwrapTemplate, unwrapHandle } from '@glimmer/opcode-compiler';
import { PathReference } from '@glimmer/reference';
import { Environment, ElementBuilder, DynamicScope, TemplateIterator } from '@glimmer/interfaces';

import Application from '../../application';
import BaseApplication, { Loader } from '../../base-application';
import mainTemplate from '../../templates/main';
import { actionHelper, ifHelper } from '../../helpers';

import RuntimeResolver from './resolver';
import ResolverDelegateImpl from './resolver-delegate';

export interface Specifier {
  specifier: string;
  managerId?: string;
}

/**
 * The RuntimeCompilerLoader is used by Glimmer.js applications that perform the
 * final template compilation step client-side. It configures the compiler to
 * resolve templates, helpers and other objects from the runtime registry, and
 * enables just-in-time compilation of templates as they are encountered.
 *
 * @public
 */
export default class RuntimeCompilerLoader implements Loader {
  async getTemplateIterator(
    app: Application,
    env: Environment,
    builder: ElementBuilder,
    dynamicScope: DynamicScope,
    self: PathReference<unknown>
  ): Promise<TemplateIterator> {
    let resolver = this.getResolver(app);
    let context = this.getContext(resolver);
    let runtime = CustomJitRuntime(resolver, context, app.env);

    let mainLayout = unwrapTemplate(templateFactory(mainTemplate).create());
    let handle = unwrapHandle(mainLayout.asLayout().compile(context));

    return Promise.resolve(
      renderJitMain(
        runtime,
        context,
        self,
        builder,
        handle,
        dynamicScope
      )
    );
  }

  getComponentTemplateIterator(
    app: BaseApplication,
    env: Environment,
    builder: ElementBuilder,
    componentName: string,
    args: RenderComponentArgs,
    dynamicScope: DynamicScope
  ): Promise<TemplateIterator> {
    let resolver = this.getResolver(app);
    let context = this.getContext(resolver);
    let runtime = CustomJitRuntime(resolver, context, env);

    return Promise.resolve(
      renderJitComponent(
        runtime,
        builder,
        context,
        0,
        componentName,
        args,
        dynamicScope
     )
    );
  }

  protected getResolver(app: BaseApplication) {
    let resolver = new RuntimeResolver(app);

    resolver.registerTemplate('main', mainTemplate);
    resolver.registerInternalHelper('action', actionHelper);
    resolver.registerHelper('if', ifHelper);
    resolver.registerInternalHelper('-get-dynamic-var', getDynamicVar);

    return resolver;
  }

  protected getContext(resolver: RuntimeResolver) {
    return JitContext(new ResolverDelegateImpl(resolver));
  }

}
