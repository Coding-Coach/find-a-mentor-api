import * as mongoose from 'mongoose';
import * as countriesDb from 'i18n-iso-countries';
import { ChannelName } from '../interfaces/user.interface';
import { Filter } from '../dto/filter.dto';

export const ChannelSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: Object.values(ChannelName),
    required: true,
  },
  id: {
    type: String,
    required: true,
  },
});

export const UserSchema = new mongoose.Schema({
  auth0Id: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
    required: true,
  },
  title: String,
  description: String,
  country: String,
  spokenLanguages: Array,
  tags: Array,
  roles: Array,
  channels: [ChannelSchema],
});

UserSchema.set('timestamps', true);

UserSchema.statics.findUniqueCountries = async function (filters): Promise<Array<Filter>> {
  const result: Array<Filter> = [];

  const countries = await this.find(filters)
    .distinct('country');

  countries.sort().forEach((id) => {
    const label = countriesDb.getName(id, 'en');

    if (label) {
      result.push(new Filter({ id, label }));
    }
  });

  return result;
};
