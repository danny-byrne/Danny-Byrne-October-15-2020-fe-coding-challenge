import {type} from 'os';
import React, {FC} from 'react';
import {connect} from 'react-redux';
import journal from 'reducers/journal';
import {start} from 'repl';

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

interface Entry {
  ACCOUNT: string | number;
  DEBIT: number;
  CREDIT: number;
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

// 2000 * * MAY-16 CSV

export default connect(
  (state: RootState): ConnectProps => {
    const balance: Balance[] = [];
    // destructure parameters from state.userInput for filtering in next step
    const {journalEntries} = state;

    const {startAccount, endAccount, startPeriod, endPeriod} = state.userInput;

    function consolidate(filtered: JournalType[]) {
      const result: any = {};
      for (let i = 0; i < filtered.length; i += 1) {
        const cur: string = filtered[i].ACCOUNT.toString();
        if (result[cur]) {
          result[cur].DEBIT += filtered[i].DEBIT;
          result[cur].CREDIT += filtered[i].CREDIT;
        } else {
          result[cur] = {
            ACCOUNT: cur,
            CREDIT: filtered[i].CREDIT,
            DEBIT: filtered[i].DEBIT,
          };
        }
      }
      return result;
    }

    // assign undefined, null or NaN values if '*' is passed in.
    const stAcct: number = startAccount === null || isNaN(startAccount) ? 1000 : startAccount;
    const endAcct: number = endAccount === null || isNaN(endAccount) ? 9999 : endAccount;
    const startPd: number =
      startPeriod === null || undefined || isNaN(startPeriod.valueOf())
        ? new Date(`01 1 2000`).getTime()
        : startPeriod.getTime();
    const endPd: number =
      endPeriod === null || undefined || isNaN(endPeriod.valueOf())
        ? new Date(`10 1 2020`).getTime()
        : endPeriod.getTime();

    const filtered: JournalType[] = journalEntries.filter(
      (e) =>
        e.ACCOUNT >= stAcct && e.ACCOUNT <= endAcct && e.PERIOD.getTime() >= startPd && e.PERIOD.getTime() <= endPd,
    );

    const consolidated = Object.entries(consolidate(filtered));

    // match descriptions to accounts
    for (let i = 0; i < consolidated.length; i += 1) {
      const curEntry: any = consolidated[i][1];
      const {ACCOUNT, CREDIT, DEBIT} = curEntry;
      for (let j = 0; j < state.accounts.length; j += 1) {
        if (state.accounts[j].ACCOUNT.toString() === ACCOUNT) {
          const obj = {
            ACCOUNT: ACCOUNT.toString(),
            DESCRIPTION: state.accounts[j].LABEL,
            DEBIT,
            CREDIT,
            BALANCE: DEBIT - CREDIT,
          };
          balance.push(obj);
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
