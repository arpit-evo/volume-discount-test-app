import { DiscountApplicationStrategy } from "../generated/api";

/**
 * @typedef {import("../generated/api").RunInput} RunInput
 * @typedef {import("../generated/api").FunctionRunResult} FunctionRunResult
 * @typedef {import("../generated/api").Target} Target
 * @typedef {import("../generated/api").ProductVariant} ProductVariant
 */

/**
 * @type {FunctionRunResult}
 */
const EMPTY_DISCOUNT = {
  discountApplicationStrategy: DiscountApplicationStrategy.First,
  discounts: [],
};

/**
 * @param {RunInput} input
 * @returns {FunctionRunResult}
 */
export function run(input: any) {
  /**
   * @type {{
   *   quantity: number
   *   percentage: number
   * }}
   */
  const configuration = JSON.parse(
    input?.discountNode?.metafield?.value ?? "{}",
  );

  if (!configuration.quantity || !configuration.percentage) {
    return EMPTY_DISCOUNT;
  }
  const targets = input.cart.lines
    .filter((line: any) => line.quantity >= configuration.quantity)
    .map((line: any) => {
      return /** @type {Target} */ {
        cartLine: {
          id: line.id,
        },
      };
    });

  if (!targets.length) {
    console.error("No cart lines qualify for volume discount.");
    return EMPTY_DISCOUNT;
  }

  return {
    discounts: [
      {
        targets,
        value: {
          percentage: {
            value: configuration.percentage.toString(),
          },
        },
      },
    ],
    discountApplicationStrategy: DiscountApplicationStrategy.First,
  };
}
