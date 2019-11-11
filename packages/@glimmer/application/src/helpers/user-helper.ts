import { Tag } from '@glimmer/validator';

import { Dict, VMArguments, CapturedArguments, Helper as GlimmerHelper } from '@glimmer/interfaces';
import { PropertyReference } from '../references';

export type UserHelper = (args: ReadonlyArray<unknown>, named: Dict<unknown>) => any;

export default function buildUserHelper(helperFunc: UserHelper): GlimmerHelper {
  return args => new HelperReference(helperFunc, args);
}

export class HelperReference extends PropertyReference<unknown> {
  tag: Tag;
  private args: CapturedArguments;

  constructor(private helper: UserHelper, args: VMArguments) {
    super();

    this.tag = args.tag;
    this.args = args.capture();
  }

  compute() {
    let { helper, args } = this;

    return helper(args.positional.value(), args.named.value());
  }
}
