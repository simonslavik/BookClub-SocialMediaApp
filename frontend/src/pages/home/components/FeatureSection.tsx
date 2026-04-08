/**
 * Reusable feature section with an image placeholder and a
 * drop-cap-styled paragraph. Supports alternating layout via `reverse` prop.
 *
 * @param {Object}  props
 * @param {string}  props.initial    – The large drop-cap letter.
 * @param {string}  props.text       – The remaining body text.
 * @param {boolean} [props.reverse]  – Swap image/text column order.
 * @param {string}  [props.bgClass]  – Optional background utility classes.
 */
const FeatureSection = ({
  initial,
  text,
  reverse = false,
  bgClass = 'bg-parchment-dark dark:bg-gray-800',
}) => (
  <section className={`${bgClass} transition-colors duration-300`}>
    <div className="max-w-6xl mx-auto px-6 md:px-16 py-16 md:py-24 flex flex-col md:flex-row items-center gap-10 md:gap-16">
      {/* Image placeholder */}
      <div className={`w-full md:w-1/2 aspect-[4/3] bg-warmgray-400 dark:bg-gray-600 rounded-sm overflow-hidden ${reverse ? 'order-1 md:order-2' : ''}`}>
        <div className="w-full h-full bg-warmgray-400 dark:bg-gray-600" />
      </div>

      {/* Text */}
      <div className={`w-full md:w-1/2 ${reverse ? 'order-2 md:order-1' : ''}`}>
        <p className="text-xl md:text-2xl leading-relaxed text-stone-800 dark:text-warmgray-200 font-serif">
          <span className="text-5xl md:text-6xl font-display font-bold float-left mr-2 leading-[0.85] mt-1 text-stone-900 dark:text-warmgray-100">
            {initial}
          </span>
          {text}
        </p>
      </div>
    </div>
  </section>
);

export default FeatureSection;
