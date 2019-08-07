import './style.less'

import React, { Component } from 'react'
import PropTypes from 'prop-types'

import muiThemeable from 'material-ui/styles/muiThemeable'
import RaisedButton from 'material-ui/RaisedButton'
import Dialog from 'material-ui/Dialog'
import Paper from 'material-ui/Paper'
import { Tabs, Tab } from 'material-ui/Tabs'
import SwipeableViews from 'react-swipeable-views'

const style = {
  dialogContent: {
    width: '350px'
  },
  dialogBody: {
    padding: 0
  },
  dialogTitle: {
    textAlign: 'center'
  }
}

class Donate extends Component {
  constructor(props) {
    super(props)
    this.state = {
      dialogOpen: false
    }
  }
  showDialog = () => {
    this.setState({
      dialogOpen: true
    })
  }
  hideDialog = () => {
    this.setState({
      dialogOpen: false
    })
  }
  openDonation = () => {
    if (chrome.i18n.getUILanguage() !== 'zh-CN') {
      chrome.tabs.create({ url: 'data:text/html;base64,PCFkb2N0eXBlIGh0bWw+DQo8aHRtbD4NCjxoZWFkPg0KCTxtZXRhIGNoYXJzZXQ9IlVURi04Ij4NCiAgICA8dGl0bGU+RG9uYXRlPC90aXRsZT4NCiAgICA8c3R5bGUgdHlwZT0idGV4dC9jc3MiPg0KCQloMSB7DQoJCQltYXJnaW46IDE1MHB4IDAgMCA1MHB4Ow0KCQkJcGFkZGluZzogNXB4IDAgMTJweCAwOw0KCQkJd2lkdGg6IDQ1MHB4Ow0KCQkJdGV4dC1hbGlnbjogY2VudGVyOw0KCQkJZm9udC1zaXplOiA2MHB4Ow0KCQkJdGV4dC1zaGFkb3c6IDVweCA1cHggNXB4IGdyYXk7DQoJCQl0cmFuc2Zvcm06cm90YXRlKDMwZGVnKTsNCgkJCWNvbG9yOiByZWQ7DQoJCQlib3JkZXI6MTJweCBzb2xpZCByZWQ7DQoJCQlib3gtc2hhZG93OiAxMHB4IDEwcHggNXB4IGdyZXk7DQoJCX0NCgk8L3N0eWxlPg0KPC9oZWFkPg0KPGJvZHk+DQo8aDE+Tm90IHlldCByZWFkeSE8L2gxPg0KPC9ib2R5Pg0KPC9odG1sPg==' })
    } else {
      this.showDialog()
    }
  }
  handleChange = value => {
    this.setState({
      slideIndex: value
    })
  }
  render() {
    const { dialogOpen, slideIndex } = this.state
    const { muiTheme } = this.props
    return (
      <div className="donor">
        <RaisedButton
          label={chrome.i18n.getMessage('settings_donate')}
          primary={true}
          onClick={this.openDonation}
        />
        <Dialog
          open={dialogOpen}
          onRequestClose={this.hideDialog}
          contentStyle={style.dialogContent}
          bodyStyle={style.dialogBody}
        >
          <Paper zDepth={2}>
            <Tabs
              onChange={this.handleChange}
              value={slideIndex}
              inkBarStyle={{ backgroundColor: muiTheme.palette.alternateTextColor }}
            >
              <Tab label="微信" value={0} />
              <Tab label="支付宝" value={1} />
            </Tabs>
          </Paper>
          <SwipeableViews
            index={slideIndex}
            onChangeIndex={this.handleChange}
          >
            <section>
              <img className="qrcode" src={require('./images/wechat.png')} alt="wechat" />
            </section>
            <section>
              <img className="qrcode" src={require('./images/alipay.png')} alt="alipay" />
            </section>
          </SwipeableViews>
          <p className="谢谢">如果你觉得这个扩展有用就支持我一下吧</p>
        </Dialog>
      </div>
    )
  }
}

export default muiThemeable()(Donate)
