import { TweetRequestBody } from '~/models/requests/Tweet.requests';
import databaseService from './database.services';
import Tweet from '~/models/schemas/Tweet.schema';
import { ObjectId, WithId } from 'mongodb';
import Hashtag from '~/models/schemas/Hashtag.schema';

class TweetsService {
  async checkAndCreateHashtags(hashtags: string[]) {
    const hashtagDocuments = await Promise.all(
      hashtags.map((hashtag) => {
        // Tìm hashtag trong database, nếu có thì lấy không có thì tạo mới
        return databaseService.hashtags.findOneAndUpdate(
          {
            name: hashtag
          },
          {
            $setOnInsert: new Hashtag({
              name: hashtag
            })
          },
          {
            upsert: true, // Tự động thêm mới nếu không tìm thấy
            returnDocument: 'after' // Trả về document sau khi cập nhật (hoặc thêm mới)
          }
        );
      })
    );
    return hashtagDocuments.map((item) => (item.value as WithId<Hashtag>)._id);
  }

  async createTweer(body: TweetRequestBody, user_id: string) {
    const hashtags = await this.checkAndCreateHashtags(body.hashtags);
    const data = await databaseService.tweets.insertOne(
      new Tweet({
        audience: body.audience,
        content: body.content,
        hashtags,
        mentions: body.mentions,
        parent_id: body.parent_id,
        type: body.type,
        user_id: new ObjectId(user_id),
        medias: body.medias
      })
    );
    const tweet = await databaseService.tweets.findOne({ _id: data.insertedId });
    return tweet;
  }
}

const tweetsService = new TweetsService();
export default tweetsService;
