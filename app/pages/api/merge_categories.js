import { createAuthenticatedApiHandler } from "./middleware/auth";
import { getDB } from "./db";

const handler = createAuthenticatedApiHandler({
  validate: (req) => {
    if (req.method !== 'POST') {
      return "Only POST method is allowed";
    }
    const { sourceCategories, newCategoryName } = req.body;
    if (!sourceCategories || !Array.isArray(sourceCategories) || sourceCategories.length < 2) {
      return "At least 2 source categories are required";
    }
    if (!newCategoryName || typeof newCategoryName !== 'string' || newCategoryName.trim() === '') {
      return "New category name is required";
    }
  },
  query: async () => ({ sql: 'SELECT 1', params: [] }),
  transform: async (_, req) => {
    const { sourceCategories, newCategoryName } = req.body;
    const target = newCategoryName.trim();
    const client = await getDB();

    try {
      // 1. Update transactions
      const txResult = await client.query(
        `UPDATE transactions SET category = $1 WHERE category = ANY($2)`,
        [target, sourceCategories]
      );

      // 2. Remove rules that would duplicate an already-existing rule for the target category
      //    (same name_pattern already points to target — merging would violate the unique constraint)
      await client.query(
        `DELETE FROM categorization_rules
         WHERE target_category = ANY($1)
           AND name_pattern IN (
             SELECT name_pattern FROM categorization_rules WHERE target_category = $2
           )`,
        [sourceCategories, target]
      );

      // 3. Migrate remaining rules from the source categories to the new category
      const rulesResult = await client.query(
        `UPDATE categorization_rules SET target_category = $1 WHERE target_category = ANY($2)`,
        [target, sourceCategories]
      );

      return {
        success: true,
        message: `Successfully merged categories into "${target}"`,
        updatedRows: txResult.rowCount,
        updatedRules: rulesResult.rowCount,
      };
    } finally {
      client.release();
    }
  }
});

export default handler; 