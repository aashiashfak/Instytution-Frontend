import { useSnackbar } from "notistack";
import { SnackbarProvider } from "notistack";
import PropTypes from "prop-types";

const useToast = () => {
  const { enqueueSnackbar } = useSnackbar();

  const showToast = (message, variant = "default") => {
    console.log("====================================");
    console.log("Message is:", message);
    console.log("====================================");

    const variantStyles = {
      success: {
        backgroundColor: "#4caf50",
      },
      error: {
        backgroundColor: "#f44336",
      },
      default: {
        backgroundColor: "#333",
      },
    };

    enqueueSnackbar(message, {
      variant,
      style: variantStyles[variant] || variantStyles.default,
      anchorOrigin: {
        vertical: "top",
        horizontal: "center",
      },
    });
  };

  useToast.propTypes = {
    message: PropTypes.string.isRequired,
    variant: PropTypes.string.isRequired,
  };

  return showToast;
};

export default useToast;
