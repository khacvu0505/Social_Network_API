import Bookmark from '~/models/schemas/Bookmark.schema';
import databaseService from './database.services';
import { ObjectId, WithId } from 'mongodb';

class BookmarkService {
  async createBookmark(tweet_id: string, user_id: string) {
    const data = await databaseService.bookmarks.findOneAndUpdate(
      {
        user_id: new ObjectId(user_id),
        tweet_id: new ObjectId(tweet_id)
      },
      {
        $setOnInsert: new Bookmark({
          tweet_id: new ObjectId(tweet_id),
          user_id: new ObjectId(user_id)
        })
      },
      {
        upsert: true, // Tự động thêm mới nếu không tìm thấy
        returnDocument: 'after' // Trả về document sau khi cập nhật (hoặc thêm mới)
      }
    );
    return data.value as WithId<Bookmark>;
  }
}

const bookmarkService = new BookmarkService();
export default bookmarkService;
