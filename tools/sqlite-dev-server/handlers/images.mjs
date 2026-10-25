// @golden - SQLite Dev Server: Product Images
import { db } from '../db.mjs';

export function handleImages(command, args) {
  switch (command) {
    case 'db_get_product_images': {
      const rows = db.prepare('SELECT * FROM local_product_images WHERE product_id = ? ORDER BY order_num ASC').all(args.productId);
      return rows.map((r) => ({
        id: r.id,
        productId: r.product_id,
        originalUrl: r.original_url,
        localPath: r.local_path,
        thumbnailPath: r.thumbnail_path,
        orderNum: r.order_num,
        isMain: Boolean(r.is_main),
        status: r.status,
      }));
    }
    case 'db_delete_product_image': {
      db.prepare('DELETE FROM local_product_images WHERE id = ?').run(args.imageId);
      return { success: true, deletedImageId: args.imageId };
    }
    case 'db_update_product_images_order': {
      const orders = args.payload?.orders || [];
      const stmt = db.prepare('UPDATE local_product_images SET order_num = ? WHERE id = ?');
      for (const o of orders) stmt.run(o.orderNum, o.imageId);
      return;
    }
    case 'db_download_product_image': {
      return { id: args.imageId, productId: '', originalUrl: args.imageUrl, status: 'DOWNLOADED' };
    }
    default:
      return undefined;
  }
}
