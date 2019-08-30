import * as mongoose from 'mongoose';
import * as countriesDb from 'i18n-iso-countries';
import * as languagesDb from 'iso-639-1';
import { ChannelName } from '../interfaces/user.interface';
import { FilterDto } from '../dto/filter.dto';

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

UserSchema.statics.findUniqueCountries = async function(filters): Promise<FilterDto[]> {
  const result: FilterDto[] = [];

  const countries = await this.find(filters)
    .distinct('country');

  countries.sort().forEach((id) => {
    const label: string = countriesDb.getName(id, 'en');

    if (label) {
      result.push(new FilterDto({ id, label }));
    }
  });

  return result;
};

UserSchema.statics.findUniqueLanguages = async function(filters): Promise<FilterDto[]> {
  const result: FilterDto[] = [];

  const languages = await this.find(filters)
    .distinct('spokenLanguages');

  languages.sort().forEach((id) => {
    // @ts-ignore
    const label: string = languagesDb.getName(id);

    if (label) {
      result.push(new FilterDto({ id, label }));
    }
  });

  return result;
};
