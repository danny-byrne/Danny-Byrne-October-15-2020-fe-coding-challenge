import {SET_USER_INPUT} from 'actions';
import {UserInputType} from '../types';

const initialState: UserInputType = {
  endAccount: null,
  endPeriod: null,
  format: '',
  startAccount: null,
  startPeriod: null,
};

export default function userInput(state = initialState, action: {type: string; payload: UserInputType}) {
  switch (action.type) {
    case SET_USER_INPUT:
      return action.payload;

    default:
      return state;
  }
}
