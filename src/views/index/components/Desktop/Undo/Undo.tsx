import React from "react"
import { inject, observer } from "mobx-react"
import makeDumbProps from "utils/makeDumbProps"

import Snackbar from "@material-ui/core/Snackbar"
import Button from "@material-ui/core/Button"

import { DesktopStore } from "../../../store/desktop"

interface PropsType {
  open: boolean
  onClose(): void
  desktopStore: DesktopStore
}

@inject("desktopStore")
@observer
class Undo extends React.Component<PropsType> {
  public state = {}

  /**
   * undo removed
   * @param all whether undo all of removed
   */
  public undo = (all?: boolean) => () => {
    this.props.desktopStore.undo(all)
    this.handleSnackbarClose()
  }

  public handleSnackbarClose = () => {
    this.props.onClose()
  }

  public render() {
    const { open } = this.props

    return (
      <Snackbar
        open={open}
        autoHideDuration={2000}
        message={this.props.desktopStore.undoMessage}
        onClose={this.handleSnackbarClose}
        action={
          <React.Fragment>
            <Button key="undo" color="secondary" size="small" onClick={this.undo()}>
              {chrome.i18n.getMessage("removed_undo")}
            </Button>
            {this.props.desktopStore.removed.length > 1 && (
              <Button key="undoAll" color="secondary" size="small" onClick={this.undo(true)}>
                {chrome.i18n.getMessage("removed_undo_all")}
              </Button>
            )}
          </React.Fragment>
        }
      />
    )
  }
}

export default makeDumbProps(Undo)
