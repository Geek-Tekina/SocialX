import { motion } from "framer-motion";
import { Card } from "@mui/material";
import { cardHover } from "../../motion/variants";

/**
 * MotionCard — MUI Card with spring lift on hover.
 * WHY: Cards that physically respond to hover create a tactile, depth-aware
 *      feel. Users subconsciously perceive the UI as more "real".
 * PERF: Only animates transform + box-shadow — both GPU-composited.
 *       No layout properties touched.
 */
const MotionCard = ({ children, sx = {}, ...props }) => (
  <motion.div
    variants={cardHover}
    initial="rest"
    whileHover="hover"
    style={{ marginBottom: 16 }}
  >
    <Card sx={{ mb: 0, ...sx }} {...props}>
      {children}
    </Card>
  </motion.div>
);

export default MotionCard;
