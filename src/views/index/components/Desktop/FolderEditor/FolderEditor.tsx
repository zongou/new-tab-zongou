import React, { useState, useEffect } from "react"

import withStyles, { WithStyles } from "@material-ui/core/styles/withStyles"
import createStyles from "@material-ui/core/styles/createStyles"
import Button from "@material-ui/core/Button"
import Dialog from "@material-ui/core/Dialog"
import DialogTitle from "@material-ui/core/DialogTitle"
import DialogContent from "@material-ui/core/DialogContent"
import DialogActions from "@material-ui/core/DialogActions"
import TextField from "@material-ui/core/TextField"

const styles = () => createStyles({
  dialog: {
    width: "30vw",
    minWidth: 300,
    maxWidth: 320,
  },
})

interface Props extends WithStyles<typeof styles> {
  open: boolean
  label: string
  onClose: (label?: string) => void
}

function FolderEditor(props: Props) {
  const { open, classes, onClose } = props
  const [label, setLabel] = useState("")

  useEffect(() => {
    if (open) {
      setLabel(props.label)
    }
  }, [props.label, open])

  function handleDone(event: React.FormEvent) {
    event.preventDefault()
    onClose(label)
  }

  function handleClose() {
    onClose()
  }

  function handleLabelChange(event: React.ChangeEvent<HTMLInputElement>) {
    setLabel(event.target.value)
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      classes={{ paper: classes.dialog }}
    >
      <form onSubmit={handleDone}>
        <DialogTitle>
          {chrome.i18n.getMessage("folder_edit_title")}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            autoFocus
            margin="dense"
            variant="outlined"
            defaultValue={label}
            label={chrome.i18n.getMessage("edit_label")}
            onChange={handleLabelChange}
          />
        </DialogContent>
        <DialogActions>
          <Button color="primary" onClick={handleClose}>
            {chrome.i18n.getMessage("button_cancel")}
          </Button>
          <Button color="primary" type="submit">
            {chrome.i18n.getMessage("button_done")}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default withStyles(styles)(FolderEditor)
