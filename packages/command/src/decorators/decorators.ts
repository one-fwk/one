import { createPropertyDecorator } from './create-property-decorator';
import { OPTION_META, POSITIONAL_META } from '../tokens';
import { OptionOptions, PositionalOptions } from '../interfaces';

/**
 * Supports decorating properties and methods
 */
export const Positional = createPropertyDecorator<PositionalOptions>(POSITIONAL_META);

/**
 * Supports decorating properties and methods
 */
export const Option = createPropertyDecorator<OptionOptions>(OPTION_META);