import { query } from "../services/db.js";

export const getStrategies = async (req, res) => {
  try {
    const { loanId } = req.params;
    const { lenderId } = req.query;

    if (!lenderId) {
      return res.status(400).json({ error: "lenderId is required" });
    }

    const strategiesResult = await query(
      `SELECT s.* 
       FROM strategies s
       JOIN loans l ON s.loan_id = l.id
       WHERE s.loan_id = $1 AND l.lender_id = $2
       ORDER BY s.created_at DESC`,
      [loanId, lenderId]
    );

    return res.json({
      success: true,
      strategies: strategiesResult.rows,
    });

  } catch (error) {
    console.error("Get Strategies Handler Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
