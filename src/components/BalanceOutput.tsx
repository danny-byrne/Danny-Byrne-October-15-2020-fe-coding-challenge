import React, {FC} from 'react';
import {connect} from 'react-redux';
import journal from 'reducers/journal';

import {JournalType, RootState, UserInputType} from 'types';
import {dateToString, toCSV} from 'utils';

interface Balance {
  ACCOUNT: string;
  DESCRIPTION: string;
  DEBIT: number;
  CREDIT: number;
  BALANCE: number;
}

interface ConnectProps {
  balance: Balance[];
  totalCredit: number;
  totalDebit: number;
  userInput: UserInputType;
}

const BalanceOutput: FC<ConnectProps> = ({balance, totalCredit, totalDebit, userInput}) => {
  if (!userInput.format || !userInput.startPeriod || !userInput.endPeriod) return null;

  return (
    <div className="output">
      <p>
        Total Debit: {totalDebit} Total Credit: {totalCredit}
        <br />
        Balance from account {userInput.startAccount || '*'} to {userInput.endAccount || '*'} from period{' '}
        {dateToString(userInput.startPeriod)} to {dateToString(userInput.endPeriod)}
      </p>
      {userInput.format === 'CSV' ? <pre>{toCSV(balance)}</pre> : null}
      {userInput.format === 'HTML' ? (
        <table className="table">
          <thead>
            <tr>
              <th>ACCOUNT</th>
              <th>DESCRIPTION</th>
              <th>DEBIT</th>
              <th>CREDIT</th>
              <th>BALANCE</th>
            </tr>
          </thead>
          <tbody>
            {balance.map((entry, i) => (
              <tr key={i}>
                <th scope="row">{entry.ACCOUNT}</th>
                <td>{entry.DESCRIPTION}</td>
                <td>{entry.DEBIT}</td>
                <td>{entry.CREDIT}</td>
                <td>{entry.BALANCE}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  );
};

export default connect(
  (state: RootState): ConnectProps => {
    const balance: Balance[] = [];

    /* YOUR CODE GOES HERE */

    // destructure parameters from state.userInput for filtering in next step
    const {journalEntries} = state;

    // console.log(state.accounts);
    console.log(journalEntries);

    // if state.userInput is not null, filter journalEntries by destructured params
    const filteredEntries: JournalType[] = journalEntries.filter(
      (e) =>
        e.ACCOUNT >= state.userInput!.startAccount &&
        e.ACCOUNT <= state.userInput!.endAccount &&
        e.PERIOD >= state.userInput!.startPeriod &&
        e.PERIOD <= state.userInput!.endPeriod,
    );

    // pull in account label from accounts to compare to journalEntries.DESCRIPTION based on account # matching
    for (let i = 0; i < filteredEntries.length; i += 1) {
      const accountNum = filteredEntries[i].ACCOUNT;
      for (let j = 0; j < state.accounts.length; j += 1) {
        if (state.accounts[j].ACCOUNT === accountNum) {
          balance.push({
            ACCOUNT: accountNum.toString(),
            BALANCE: filteredEntries[i].DEBIT - filteredEntries[i].CREDIT,
            CREDIT: filteredEntries[i].CREDIT,
            DEBIT: filteredEntries[i].DEBIT,
            DESCRIPTION: state.accounts[j].LABEL,
          });
          break;
        }
      }
    }

    const totalCredit = balance.reduce((acc, entry) => acc + entry.CREDIT, 0);
    const totalDebit = balance.reduce((acc, entry) => acc + entry.DEBIT, 0);

    return {
      balance,
      totalCredit,
      totalDebit,
      userInput: state.userInput,
    };
  },
)(BalanceOutput);
